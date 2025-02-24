
export const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'hubspot', label: 'Hubspot' },
  { value: 'gohighlevel', label: 'GoHighLevel' },
  { value: 'activix', label: 'Activix' },
];

export const platformActions = {
  facebook: [
    { value: 'new_lead', label: 'New Lead' },
    { value: 'message_received', label: 'Message Received' },
  ],
  hubspot: [
    { value: 'new_contact', label: 'New Contact' },
    { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
  ],
  gohighlevel: [
    { value: 'contact_created', label: 'Contact Created' },
    { value: 'opportunity_won', label: 'Opportunity Won' },
  ],
  activix: [
    { value: 'ticket_created', label: 'Ticket Created' },
    { value: 'payment_received', label: 'Payment Received' },
  ],
} as const;
