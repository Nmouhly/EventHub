/**
 * Unit tests for registrationService.
 *
 * All PostgreSQL access is mocked — no real database connection is required.
 * The transaction() helper is replaced by a thin wrapper that runs the callback
 * synchronously with a shared mock db client, which mirrors what the real
 * implementation does inside a BEGIN/COMMIT block.
 */
import { jest } from '@jest/globals';

// ─── Shared mock db client passed to every transactional callback ────────────
const mockDb = {};

// ─── Mock modules BEFORE any dynamic import ─────────────────────────────────
jest.unstable_mockModule('../../src/config/database.js', () => ({
  pool: {},
  transaction: jest.fn(async (work) => work(mockDb)),
}));

jest.unstable_mockModule('../../src/repositories/registrationRepository.js', () => ({
  list: jest.fn(),
  findById: jest.fn(),
  findExisting: jest.fn(),
  countActive: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  cancelForEvent: jest.fn(),
}));

jest.unstable_mockModule('../../src/repositories/participantRepository.js', () => ({
  findById: jest.fn(),
}));

// registrationService imports lockEvent from eventService, which itself imports
// eventRepository and database — mock eventService directly so we control the
// locked event object returned in every test.
jest.unstable_mockModule('../../src/services/eventService.js', () => ({
  lockEvent: jest.fn(),
  list: jest.fn(),
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
}));

// ─── Dynamic imports (must come AFTER mock declarations) ────────────────────
const { transaction } = await import('../../src/config/database.js');
const regRepo = await import('../../src/repositories/registrationRepository.js');
const partRepo = await import('../../src/repositories/participantRepository.js');
const eventService = await import('../../src/services/eventService.js');
const service = await import('../../src/services/registrationService.js');

// ─── Fixtures ────────────────────────────────────────────────────────────────
const EVENT_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const PARTICIPANT_ID = 'bbbbbbbb-0000-4000-8000-000000000001';
const REG_ID = 'cccccccc-0000-4000-8000-000000000001';

const publishedEvent = {
  id: EVENT_ID,
  status: 'published',
  max_participants: 10,
};

const pendingReg = {
  id: REG_ID,
  eventId: EVENT_ID,
  participantId: PARTICIPANT_ID,
  status: 'pending',
  event: { id: EVENT_ID, status: 'published' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resetAllMocks() {
  jest.clearAllMocks();
  // Restore transaction to its default pass-through behaviour after each test.
  transaction.mockImplementation(async (work) => work(mockDb));
}

// =============================================================================
// service.create / createWithConnection
// =============================================================================

describe('registrationService.create', () => {
  beforeEach(resetAllMocks);

  test('throws EVENT_NOT_FOUND when event does not exist', async () => {
    eventService.lockEvent.mockRejectedValue(
      Object.assign(new Error('not found'), { status: 404, code: 'EVENT_NOT_FOUND' }),
    );

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'EVENT_NOT_FOUND' });
  });

  test('throws EVENT_NOT_PUBLISHED when event status is draft', async () => {
    eventService.lockEvent.mockResolvedValue({ ...publishedEvent, status: 'draft' });
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(undefined);
    regRepo.countActive.mockResolvedValue(0);

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'EVENT_NOT_PUBLISHED' });
  });

  test('throws EVENT_NOT_PUBLISHED when event status is cancelled', async () => {
    eventService.lockEvent.mockResolvedValue({ ...publishedEvent, status: 'cancelled' });
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(undefined);
    regRepo.countActive.mockResolvedValue(0);

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'EVENT_NOT_PUBLISHED' });
  });

  test('throws PARTICIPANT_NOT_FOUND when participant does not exist', async () => {
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    partRepo.findById.mockResolvedValue(undefined); // not found

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'PARTICIPANT_NOT_FOUND' });
  });

  test('throws ALREADY_REGISTERED when an active registration exists', async () => {
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    // existing active registration (pending or confirmed)
    regRepo.findExisting.mockResolvedValue({ id: REG_ID, status: 'pending' });
    regRepo.countActive.mockResolvedValue(1);

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'ALREADY_REGISTERED' });
  });

  test('throws EVENT_FULL when capacity is reached', async () => {
    eventService.lockEvent.mockResolvedValue({ ...publishedEvent, max_participants: 2 });
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(undefined);
    regRepo.countActive.mockResolvedValue(2); // at capacity

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toMatchObject({ code: 'EVENT_FULL' });
  });

  test('creates a new registration successfully', async () => {
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(undefined);
    regRepo.countActive.mockResolvedValue(0);
    regRepo.create.mockResolvedValue(pendingReg);

    const result = await service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID });

    expect(regRepo.create).toHaveBeenCalledWith(EVENT_ID, PARTICIPANT_ID, mockDb);
    expect(result).toEqual(pendingReg);
  });

  test('reactivates a cancelled registration instead of creating a duplicate', async () => {
    const cancelledReg = { id: REG_ID, status: 'cancelled' };
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(cancelledReg);
    regRepo.countActive.mockResolvedValue(0);
    regRepo.updateStatus.mockResolvedValue({ ...cancelledReg, status: 'pending' });

    await service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID });

    expect(regRepo.create).not.toHaveBeenCalled();
    expect(regRepo.updateStatus).toHaveBeenCalledWith(REG_ID, 'pending', mockDb);
  });

  test('propagates unexpected repository errors', async () => {
    const dbError = new Error('connection reset');
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    partRepo.findById.mockResolvedValue({ id: PARTICIPANT_ID });
    regRepo.findExisting.mockResolvedValue(undefined);
    regRepo.countActive.mockResolvedValue(0);
    regRepo.create.mockRejectedValue(dbError);

    await expect(service.create({ eventId: EVENT_ID, participantId: PARTICIPANT_ID }))
      .rejects.toThrow('connection reset');
  });
});

// =============================================================================
// service.updateStatus
// =============================================================================

describe('registrationService.updateStatus', () => {
  beforeEach(resetAllMocks);

  test('throws REGISTRATION_NOT_FOUND when registration does not exist', async () => {
    regRepo.findById.mockResolvedValue(undefined);

    await expect(service.updateStatus(REG_ID, 'confirmed'))
      .rejects.toMatchObject({ code: 'REGISTRATION_NOT_FOUND' });
  });

  test('throws INVALID_REGISTRATION_STATUS_TRANSITION for forbidden transition confirmed→pending', async () => {
    regRepo.findById.mockResolvedValue({ ...pendingReg, status: 'confirmed' });
    eventService.lockEvent.mockResolvedValue(publishedEvent);

    await expect(service.updateStatus(REG_ID, 'pending'))
      .rejects.toMatchObject({ code: 'INVALID_REGISTRATION_STATUS_TRANSITION' });
  });

  test('allows pending → confirmed', async () => {
    regRepo.findById.mockResolvedValue(pendingReg);
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    regRepo.updateStatus.mockResolvedValue({ ...pendingReg, status: 'confirmed' });

    const result = await service.updateStatus(REG_ID, 'confirmed');

    expect(regRepo.updateStatus).toHaveBeenCalledWith(REG_ID, 'confirmed', mockDb);
    expect(result.status).toBe('confirmed');
  });

  test('allows pending → cancelled', async () => {
    regRepo.findById.mockResolvedValue(pendingReg);
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    regRepo.updateStatus.mockResolvedValue({ ...pendingReg, status: 'cancelled' });

    const result = await service.updateStatus(REG_ID, 'cancelled');

    expect(regRepo.updateStatus).toHaveBeenCalledWith(REG_ID, 'cancelled', mockDb);
    expect(result.status).toBe('cancelled');
  });

  test('allows confirmed → cancelled', async () => {
    const confirmed = { ...pendingReg, status: 'confirmed' };
    regRepo.findById.mockResolvedValue(confirmed);
    eventService.lockEvent.mockResolvedValue(publishedEvent);
    regRepo.updateStatus.mockResolvedValue({ ...confirmed, status: 'cancelled' });

    const result = await service.updateStatus(REG_ID, 'cancelled');
    expect(result.status).toBe('cancelled');
  });

  test('reactivating a cancelled registration checks capacity', async () => {
    const cancelled = { ...pendingReg, status: 'cancelled' };
    regRepo.findById.mockResolvedValue(cancelled);
    eventService.lockEvent.mockResolvedValue({ ...publishedEvent, max_participants: 1 });
    // capacity already full — reactivation must be blocked
    regRepo.countActive.mockResolvedValue(1);

    await expect(service.updateStatus(REG_ID, 'confirmed'))
      .rejects.toMatchObject({ code: 'EVENT_FULL' });
  });

  test('cannot transition to non-cancelled status on a cancelled event', async () => {
    regRepo.findById.mockResolvedValue(pendingReg);
    // event is cancelled: requirePublished should throw
    eventService.lockEvent.mockResolvedValue({ ...publishedEvent, status: 'cancelled' });

    await expect(service.updateStatus(REG_ID, 'confirmed'))
      .rejects.toMatchObject({ code: 'EVENT_NOT_PUBLISHED' });
  });
});
