import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';

type UserRole = 'admin' | 'staff';

interface FormValues {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const initialValues: FormValues = {
  username: '',
  email: '',
  password: '',
  role: 'staff',
};

const Signup: React.FC = () => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.register(values);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError((err as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto mt-8 p-6 bg-background border rounded-lg"
    >
      <h2 className="text-xl font-semibold text-center">Sign Up</h2>

      <input
        name="username"
        value={values.username}
        placeholder="Username"
        onChange={handleChange}
        required
        className="input w-full"
        disabled={loading}
      />

      <input
        name="email"
        value={values.email}
        type="email"
        placeholder="Email"
        onChange={handleChange}
        required
        className="input w-full"
        disabled={loading}
      />

      <input
        name="password"
        value={values.password}
        type="password"
        placeholder="Password"
        onChange={handleChange}
        required
        className="input w-full"
        disabled={loading}
      />

      <label htmlFor="role" className="sr-only">Role</label>
      <select
        id="role"
        name="role"
        value={values.role}
        onChange={handleChange}
        className="input w-full"
        disabled={loading}
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Success! Redirecting…</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing up…' : 'Sign Up'}
      </Button>
    </form>
  );
};

export default Signup;
