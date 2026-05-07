import InputField from "@components/parsial/InputField";
import { useState } from "react";

export default function FormAirlines() {
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    let newError = {};

    if (!form.name) newError.name = "Name is required";
    if (!form.email) newError.email = "Email is required";

    setErrors(newError);
  };

  return (
    <>
      <InputField
        label="Name"
        name="name"
        placeholder="John Doe"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
      />

      <InputField
        label="Email"
        name="email"
        placeholder="johndoe@mail.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />
      <button className="btn btn-primary" onClick={handleSubmit}>
        Submit
      </button>
    </>
  );
}
