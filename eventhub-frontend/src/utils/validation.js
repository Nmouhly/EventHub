export function validateEvent(values) {
  const errors = {};
  for (const key of ['title', 'location', 'eventDate'])
    if (!values[key]?.trim()) errors[key] = 'This field is required.';
  if (values.eventDate && Number.isNaN(new Date(values.eventDate).getTime()))
    errors.eventDate = 'Enter a valid date and time.';
  if (!Number.isInteger(Number(values.maxParticipants)) || Number(values.maxParticipants) < 1)
    errors.maxParticipants = 'Enter a positive whole number.';
  return errors;
}
export function validateParticipant(values) {
  const errors = {};
  if (!values.fullName?.trim()) errors.fullName = 'Full name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || ''))
    errors.email = 'Enter a valid email address.';
  return errors;
}
