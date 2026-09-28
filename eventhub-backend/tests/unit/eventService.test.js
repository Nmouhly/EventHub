/**
 * Unit tests for eventService.
 *
 * All PostgreSQL access is mocked — no real database connection is required.
 * transaction() is replaced by a thin pass-through that runs the callback
 * with a shared mock db client, matching the real BEGIN/COMMIT behaviour.
 */
import { jest } from '@jest/globals';

// ─── Shared mock db client ────────────────────────────────────────────────────
const mockDb = {};

// ─── Mock modules BEFORE any dynamic import ──────────────────────────────────
jest.unstable_mockModule('../../src/config/database.js', () => ({
  pool: {},
  transaction: jest.fn(async (work) => work(mockDb)),
}));

jest.unstable_mockModule('../../src/repositories/eventRepository.js', () => ({
  list: jest.fn(),
  findById: jest.fn(),
  lockById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
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

// ─── Dynamic imports (must come AFTER mock declarations) ─────────────────────
const { transaction } = await import('../../src/config/database.js');
const eventRepo = await import('../../src/repositories/eventRepository.js');
const regRepo = await import('../../src/repositories/registrationRepository.js');
const service = await import('../../src/services/eventService.js');

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const EVENT_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

const draftEvent = {
  id: EVENT_ID,
  status: 'draft',
  max_participants: 50,
  title: 'Test Event',
};

const publishedEvent = { ...draftEvent, status: 'published' };
const cancelledEvent = { ...draftEvent, status: 'cancelled' };

const eventData = {
  title: 'Updated Title',
  description: 'Desc',
  location: 'Casablanca',
  eventDate: '2030-06-01T10:00:00Z',
  maxParticipants: 30,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resetAllMocks() {
  jest.clearAllMocks();
  transaction.mockImplementation(async (work) => work(mockDb));
}

// =============================================================================
// service.get
// =============================================================================

describe('eventService.get', () => {
  beforeEach(resetAllMocks);

  test('returns event when found', async () => {
    eventRepo.findById.mockResolvedValue(publishedEvent);

    const result = await service.get(EVENT_ID);

    expect(eventRepo.findById).toHaveBeenCalledWith(EVENT_ID);
    expect(result).toEqual(publishedEvent);
  });

  test('throws EVENT_NOT_FOUND when event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(undefined);

    await expect(service.get(EVENT_ID))
      .rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });
});

// =============================================================================
// service.lockEvent
// =============================================================================

describe('eventService.lockEvent', () => {
  beforeEach(resetAllMocks);

  test('returns locked event row when found', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);

    const result = await service.lockEvent(EVENT_ID, mockDb);

    expect(eventRepo.lockById).toHaveBeenCalledWith(EVENT_ID, mockDb);
    expect(result).toEqual(draftEvent);
  });

  test('throws EVENT_NOT_FOUND when row does not exist', async () => {
    eventRepo.lockById.mockResolvedValue(undefined);

    await expect(service.lockEvent(EVENT_ID, mockDb))
      .rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });
});

// =============================================================================
// service.update
// =============================================================================

describe('eventService.update', () => {
  beforeEach(resetAllMocks);

  test('updates event when new capacity is equal to active registrations', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);
    regRepo.countActive.mockResolvedValue(30);
    eventRepo.update.mockResolvedValue({ ...draftEvent, ...eventData });

    const result = await service.update(EVENT_ID, { ...eventData, maxParticipants: 30 });

    expect(eventRepo.update).toHaveBeenCalled();
    expect(result.title).toBe('Updated Title');
  });

  test('throws MAX_PARTICIPANTS_TOO_LOW when new capacity is below active count', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);
    regRepo.countActive.mockResolvedValue(10);

    await expect(service.update(EVENT_ID, { ...eventData, maxParticipants: 5 }))
      .rejects.toMatchObject({ code: 'MAX_PARTICIPANTS_TOO_LOW' });

    expect(eventRepo.update).not.toHaveBeenCalled();
  });

  test('throws EVENT_NOT_FOUND when event does not exist', async () => {
    eventRepo.lockById.mockResolvedValue(undefined);

    await expect(service.update(EVENT_ID, eventData))
      .rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });

  test('propagates unexpected repository errors', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);
    regRepo.countActive.mockResolvedValue(0);
    eventRepo.update.mockRejectedValue(new Error('disk full'));

    await expect(service.update(EVENT_ID, eventData))
      .rejects.toThrow('disk full');
  });
});

// =============================================================================
// service.updateStatus
// =============================================================================

describe('eventService.updateStatus', () => {
  beforeEach(resetAllMocks);

  // ── draft → published ──────────────────────────────────────────────────────
  test('transitions draft → published', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);
    eventRepo.updateStatus.mockResolvedValue();
    eventRepo.findById.mockResolvedValue(publishedEvent);

    const result = await service.updateStatus(EVENT_ID, 'published');

    expect(eventRepo.updateStatus).toHaveBeenCalledWith(EVENT_ID, 'published', mockDb);
    expect(regRepo.cancelForEvent).not.toHaveBeenCalled();
    expect(result).toEqual(publishedEvent);
  });

  // ── draft → cancelled ─────────────────────────────────────────────────────
  test('transitions draft → cancelled and cancels all registrations', async () => {
    eventRepo.lockById.mockResolvedValue(draftEvent);
    eventRepo.updateStatus.mockResolvedValue();
    regRepo.cancelForEvent.mockResolvedValue();
    eventRepo.findById.mockResolvedValue(cancelledEvent);

    const result = await service.updateStatus(EVENT_ID, 'cancelled');

    expect(eventRepo.updateStatus).toHaveBeenCalledWith(EVENT_ID, 'cancelled', mockDb);
    expect(regRepo.cancelForEvent).toHaveBeenCalledWith(EVENT_ID, mockDb);
    expect(result).toEqual(cancelledEvent);
  });

  // ── published → cancelled ─────────────────────────────────────────────────
  test('transitions published → cancelled and cancels all registrations', async () => {
    eventRepo.lockById.mockResolvedValue(publishedEvent);
    eventRepo.updateStatus.mockResolvedValue();
    regRepo.cancelForEvent.mockResolvedValue();
    eventRepo.findById.mockResolvedValue(cancelledEvent);

    await service.updateStatus(EVENT_ID, 'cancelled');

    expect(regRepo.cancelForEvent).toHaveBeenCalledWith(EVENT_ID, mockDb);
  });

  // ── published → draft (forbidden) ─────────────────────────────────────────
  test('throws INVALID_EVENT_STATUS_TRANSITION for published → draft', async () => {
    eventRepo.lockById.mockResolvedValue(publishedEvent);

    await expect(service.updateStatus(EVENT_ID, 'draft'))
      .rejects.toMatchObject({ code: 'INVALID_EVENT_STATUS_TRANSITION' });

    expect(eventRepo.updateStatus).not.toHaveBeenCalled();
    expect(regRepo.cancelForEvent).not.toHaveBeenCalled();
  });

  // ── cancelled → anything (forbidden) ──────────────────────────────────────
  test('throws INVALID_EVENT_STATUS_TRANSITION for cancelled → published', async () => {
    eventRepo.lockById.mockResolvedValue(cancelledEvent);

    await expect(service.updateStatus(EVENT_ID, 'published'))
      .rejects.toMatchObject({ code: 'INVALID_EVENT_STATUS_TRANSITION' });
  });

  test('throws INVALID_EVENT_STATUS_TRANSITION for cancelled → draft', async () => {
    eventRepo.lockById.mockResolvedValue(cancelledEvent);

    await expect(service.updateStatus(EVENT_ID, 'draft'))
      .rejects.toMatchObject({ code: 'INVALID_EVENT_STATUS_TRANSITION' });
  });

  // ── event not found ────────────────────────────────────────────────────────
  test('throws EVENT_NOT_FOUND when event does not exist', async () => {
    eventRepo.lockById.mockResolvedValue(undefined);

    await expect(service.updateStatus(EVENT_ID, 'published'))
      .rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });

  // ── rollback on cancelForEvent failure ────────────────────────────────────
  test('propagates error when cancelForEvent fails (triggers transaction rollback)', async () => {
    eventRepo.lockById.mockResolvedValue(publishedEvent);
    eventRepo.updateStatus.mockResolvedValue();
    regRepo.cancelForEvent.mockRejectedValue(new Error('timeout'));

    await expect(service.updateStatus(EVENT_ID, 'cancelled'))
      .rejects.toThrow('timeout');

    // The real transaction() would roll back; our mock propagates the error.
    expect(eventRepo.findById).not.toHaveBeenCalled();
  });
});
