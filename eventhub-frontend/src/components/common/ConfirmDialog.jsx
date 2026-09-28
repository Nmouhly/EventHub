import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { errorMessage } from '../../api/axios';
export default function ConfirmDialog({ title, description, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p>{description}</p>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={busy}>
          {busy ? 'Saving…' : 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
}
