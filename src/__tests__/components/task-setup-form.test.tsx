import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskSetupForm, TaskDetails } from '../../components/task-setup-form';
import { useToast } from '@/hooks/use-toast';
import { extractWebsitesAction } from '@/app/actions';
import { createClientComponentClient } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/app/actions', () => ({
  extractWebsitesAction: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'new-flow-id' }],
          error: null,
        }),
      })),
    })),
  }),
}));


describe('TaskSetupForm', () => {
  const onStartTaskMock = jest.fn();

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
    (extractWebsitesAction as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(['https://google.com']), 100))
    );
  });

  const renderComponent = () => {
    render(
      <TaskSetupForm
        onStartTask={onStartTaskMock}
        presets={[]}
        isLoadingPresets={false}
      />
    );
  };

  // Test Case 1: Check for empty description validation
  test('should show validation error for short description', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText(/e.g., 'Drafting the quarterly report/i), {
      target: { value: 'short' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Start Focus Session/i }));

    expect(await screen.findByText('Please provide a more detailed task description.')).toBeInTheDocument();
    expect(onStartTaskMock).not.toHaveBeenCalled();
  });

  // Test Case 2: Check for empty approved tools description validation
  test('should show validation error for short approved tools description', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText(/e.g., 'I will be using Google Docs/i), {
      target: { value: 'tools' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Start Focus Session/i }));

    expect(await screen.findByText('Please describe the tools and websites you need.')).toBeInTheDocument();
    expect(onStartTaskMock).not.toHaveBeenCalled();
  });

  // Test Case 3: Check for minimum time validation
  test('should show validation error for time less than 1 minute', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByLabelText(/Focus Duration/i), {
      target: { value: '0' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Start Focus Session/i }));

    expect(await screen.findByText('Task must be at least 1 minute long.')).toBeInTheDocument();
    expect(onStartTaskMock).not.toHaveBeenCalled();
  });

  // Test Case 4: Check for maximum time validation
  test('should show validation error for time greater than 240 minutes', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByLabelText(/Focus Duration/i), {
      target: { value: '241' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Start Focus Session/i }));

    expect(await screen.findByText('Task cannot exceed 240 minutes.')).toBeInTheDocument();
    expect(onStartTaskMock).not.toHaveBeenCalled();
  });

  // Test Case 5: Successful submission with valid data
  test('should call onStartTask with correct details on successful submission', async () => {
    renderComponent();

    const description = 'This is a valid and sufficiently long task description.';
    const approvedTools = 'I will use Google Docs and our internal Confluence wiki.';
    const time = 45;

    fireEvent.change(screen.getByPlaceholderText(/e.g., 'Drafting the quarterly report/i), {
      target: { value: description },
    });

    fireEvent.change(screen.getByPlaceholderText(/e.g., 'I will be using Google Docs/i), {
      target: { value: approvedTools },
    });

    fireEvent.change(screen.getByLabelText(/Focus Duration/i), {
      target: { value: time.toString() },
    });

    fireEvent.submit(screen.getByRole('button', { name: /Start Focus Session/i }));

    await waitFor(() => {
      expect(screen.getByText('Analyzing & Preparing...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onStartTaskMock).toHaveBeenCalledTimes(1);
      const expectedDetails: TaskDetails = {
        description,
        approvedToolsDescription: approvedTools,
        time,
        approvedWebsites: ['https://google.com'],
        flowId: 'new-flow-id',
      };
      expect(onStartTaskMock).toHaveBeenCalledWith(expectedDetails);
    });
  });
});
