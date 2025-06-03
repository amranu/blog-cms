import React from 'react';
import FormLayout from './FormLayout';

function RegisterForm({ register, username, setUsername, password, setPassword, firstname, setFirstname, lastname, setLastname, middlename, setMiddlename, email, setEmail }) {
  return (
    <>
      <FormLayout title="Register" link="/login" linkText="Login">
      <form onSubmit={register} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '20px'}}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} required placeholder="First Name" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} required placeholder="Last Name" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="text" value={middlename} onChange={(e) => setMiddlename(e.target.value)} required placeholder="Middle Name (Optional)" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #CCC' }} />
        <input type="submit" value="Register" style={{ cursor: 'pointer', padding: '10px', backgroundColor: 'green', color: '#FFF', borderRadius: '5px', marginTop: '10px' }} />
      </form>
      </FormLayout>
    </>
  );
}

export default RegisterForm;
