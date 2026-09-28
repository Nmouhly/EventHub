import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { createUser, updateUser } from '../../api/usersApi';
import { errorMessage } from '../../api/axios';
import { validateUser } from '../../utils/validation';
import useAuth from '../../hooks/useAuth';
export default function UserForm({ operator, onClose, onSaved }) {
  const { user } = useAuth();
  const [values, setValues] = useState({
    fullName: operator.fullName || '',
    email: operator.email || '',
    role: operator.role || 'staff',
    isActive: operator.isActive ?? true,
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const self = operator.id === user.id;
  const bind = (name) => ({
    value: values[name],
    error: errors[name],
    onChange: (e) => setValues({ ...values, [name]: e.target.value }),
  });
  async function submit(e) {
    e.preventDefault();
    const validation = validateUser(values, !operator.id);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setBusy(true);
    setError('');
    try {
      const { password, ...data } = values;
      if (operator.id) await updateUser(operator.id, data);
      else await createUser({ ...data, password });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={operator.id ? 'Edit operator' : 'Add operator'} busy={busy} onClose={onClose}>
      <form onSubmit={submit}>
        <Input label="Full name" required maxLength={200} {...bind('fullName')} />
        <Input label="Email address" type="email" required autoComplete="off" {...bind('email')} />
        {!operator.id && (
          <Input
            label="Password (12–72 characters)"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={72}
            {...bind('password')}
          />
        )}
        <Select label="Role" disabled={self} {...bind('role')}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </Select>
        <p className="form-hint">
          Admin can manage operators. Staff can manage events, participants and registrations.
        </p>
        <Select
          label="Account status"
          disabled={self}
          value={String(values.isActive)}
          onChange={(e) => setValues({ ...values, isActive: e.target.value === 'true' })}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        {operator.id && !values.isActive && (
          <p className="form-hint">
            Saving will block this operator’s login and existing sessions.
          </p>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button variant="secondary" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy}>{busy ? 'Saving…' : 'Save operator'}</Button>
        </div>
      </form>
    </Modal>
  );
}
