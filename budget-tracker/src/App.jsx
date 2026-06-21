import { useState } from "react";

export default function App() {
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const balance = income - expense;

  return (
    <div style={{ padding: 20 }}>
      <h1>Budget Tracker</h1>

      <div>
        <p>Income</p>
        <input
          type="number"
          onChange={(e) => setIncome(Number(e.target.value))}
        />
      </div>

      <div>
        <p>Expense</p>
        <input
          type="number"
          onChange={(e) => setExpense(Number(e.target.value))}
        />
      </div>

      <h2>Balance: ${balance}</h2>
    </div>
  );
}