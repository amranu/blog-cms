import React from 'react';
import FormLayout from './FormLayout';

function LoginForm({ login, username, setUsername, password, setPassword }) {
  return (
    <FormLayout title="Login" link="/register" linkText="Register">
      <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '20px'}}>
        <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="submit" value="Submit" style={{ cursor: 'pointer', padding: '10px', backgroundColor: 'green', color: '#FFF', borderRadius: '5px', marginTop: '10px' }} />
      </form>
    </FormLayout>
  );
}

export default LoginForm;
