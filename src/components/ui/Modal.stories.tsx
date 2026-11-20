import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    locked: { control: 'boolean' },
    drawer: { control: 'boolean' },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function ModalHarness(props: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={props.title ?? 'Example modal'}
        {...props}
      >
        {props.children ?? (
          <p className="text-sm text-ink-2">
            Modal body content goes here. Use this for confirmations, forms, or detail panels.
          </p>
        )}
      </Modal>
    </div>
  );
}

export const Default: Story = {
  render: () => <ModalHarness />,
};

export const WithEyebrow: Story = {
  render: () => <ModalHarness eyebrow="Transaction #4821" title="Void this sale?" />,
};

export const WithFooter: Story = {
  render: () => (
    <ModalHarness
      title="Confirm refund"
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Refund £18.00</Button>
        </>
      }
    />
  ),
};

export const Small: Story = {
  render: () => <ModalHarness size="sm" title="Quick note" />,
};

export const Large: Story = {
  render: () => <ModalHarness size="lg" title="End-of-day report" />,
};

export const Drawer: Story = {
  render: () => <ModalHarness drawer title="Payment details" />,
};

export const Locked: Story = {
  render: () => (
    <ModalHarness
      locked
      title="Awaiting payment…"
    >
      <p className="text-sm text-ink-2">
        Present the QR code to your customer. This dialog cannot be dismissed until the
        transaction completes or times out.
      </p>
    </ModalHarness>
  ),
};
