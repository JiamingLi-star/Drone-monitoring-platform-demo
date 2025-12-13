import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders headline and toggles simulation mode', async () => {
    render(<App />);

    expect(screen.getByText(/Drone Monitoring Platform/i)).toBeInTheDocument();

    const simulationButton = screen.getByRole('button', { name: /Simulation/i });
    fireEvent.click(simulationButton);

    await waitFor(() => {
      expect(screen.getByText(/Simulation mode active/i)).toBeInTheDocument();
    });
  });
});
