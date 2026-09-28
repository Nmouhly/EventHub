import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { createParticipant, updateParticipant } from '../../api/participantsApi';
import { errorMessage } from '../../api/axios';
import { validateParticipant } from '../../utils/validation';
export default function ParticipantForm({ participant, onClose, onSaved }) {
  const [values, setValues] = useState({
    fullName: participant?.fullName || '',
    email: participant?.email || '',
    phone: participant?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const validation = validateParticipant(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setBusy(true);
    setError('');
    try {
      if (participant?.id) await updateParticipant(participant.id, values);
      else await createParticipant(values);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={participant?.id ? 'Edit participant' : 'Add a participant'}
      onClose={onClose}
      busy={busy}
    >
      <p>A new face. A new connection.</p>
      <form onSubmit={submit} noValidate>
        {[
          ['fullName', 'Full name', 'text'],
          ['email', 'Email address', 'email'],
          ['phone', 'Phone number (optional)', 'tel'],
        ].map(([name, label, type]) => (
          <Input
            key={name}
            label={label}
            type={type}
            value={values[name]}
            error={errors[name]}
            onChange={(e) => setValues({ ...values, [name]: e.target.value })}
            required={name !== 'phone'}
          />
        ))}
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Save participant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
