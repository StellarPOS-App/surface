import type { Meta, StoryObj } from '@storybook/react';
import { ShoppingCart } from 'lucide-react';
import Button from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'cash', 'card', 'lumen'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Charge £12.50' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'More options' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Void transaction' },
};

export const Cash: Story = {
  args: { variant: 'cash', children: 'Pay with cash' },
};

export const Card: Story = {
  args: { variant: 'card', children: 'Pay by card' },
};

export const Lumen: Story = {
  args: { variant: 'lumen', children: 'Pay with Stellar' },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <ShoppingCart className="h-4 w-4" />,
    children: 'Add to order',
  },
};

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Processing…' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Charge £12.50' },
};

export const FullWidth: Story = {
  args: { variant: 'primary', fullWidth: true, children: 'Charge £12.50' },
  parameters: { layout: 'padded' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">XL</Button>
    </div>
  ),
};
