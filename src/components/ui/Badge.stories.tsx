import type { Meta, StoryObj } from '@storybook/react';
import Badge, { MethodBadge, StatusBadge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'ink', 'cash', 'card', 'lumen', 'signal', 'amber'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', children: 'Draft' },
};

export const Ink: Story = {
  args: { tone: 'ink', children: 'New' },
};

export const Cash: Story = {
  args: { tone: 'cash', children: 'Paid' },
};

export const Card: Story = {
  args: { tone: 'card', children: 'Card' },
};

export const Lumen: Story = {
  args: { tone: 'lumen', children: 'Stellar' },
};

export const Signal: Story = {
  args: { tone: 'signal', children: 'Refunded' },
};

export const Amber: Story = {
  args: { tone: 'amber', children: 'Pending' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'ink', 'cash', 'card', 'lumen', 'signal', 'amber'] as const).map((tone) => (
        <Badge key={tone} tone={tone}>{tone}</Badge>
      ))}
    </div>
  ),
};

export const TransactionStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      <StatusBadge status="pending" />
      <StatusBadge status="completed" />
      <StatusBadge status="void" />
      <StatusBadge status="refunded" />
    </div>
  ),
};

export const PaymentMethods: Story = {
  render: () => (
    <div className="flex gap-2">
      <MethodBadge method="cash" />
      <MethodBadge method="card" />
      <MethodBadge method="stellar" />
    </div>
  ),
};
