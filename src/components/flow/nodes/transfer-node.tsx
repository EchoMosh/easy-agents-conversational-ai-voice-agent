import { useState, KeyboardEvent } from 'react';
import { Handle, Position } from '@xyflow/react';
import { PhoneForwarded, Plus, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface TransferNodeData {
  message?: string;
  contacts: Contact[];
}

export function TransferNode({ data }: { data: TransferNodeData }) {
  const [message, setMessage] = useState(data.message || "Transferring call now...");
  const [contacts, setContacts] = useState<Contact[]>(data.contacts || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (field: keyof TransferNodeData, value: string | Contact[]) => {
    const updatedData = {
      message,
      contacts,
      [field]: value
    };
    
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id: "transfer-node",
        data: updatedData
      }
    });
    window.dispatchEvent(evt);

    if (field === 'message') {
      setMessage(value as string);
    } else if (field === 'contacts') {
      setContacts(value as Contact[]);
    }
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    
    const newContact = {
      id: Math.random().toString(36).substr(2, 9),
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim()
    };
    
    const updatedContacts = [...contacts, newContact];
    handleChange('contacts', updatedContacts);
    
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addContact();
    }
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    const updatedContacts = contacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    );
    handleChange('contacts', updatedContacts);
  };

  const removeContact = (id: string) => {
    const updatedContacts = contacts.filter(contact => contact.id !== id);
    handleChange('contacts', updatedContacts);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(16,185,129,0.3)] p-5 min-w-[300px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.5)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-emerald-400 opacity-20" />
                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                  <PhoneForwarded className="h-4 w-4" />
                </span>
              </span>
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                Transfer Call
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
                  Transfer Message
                </Label>
                <Input
                  value={message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
                  placeholder="Enter transfer message..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
                    Contact List ({contacts.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit Contacts
                  </Button>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">Name</TableHead>
                        <TableHead className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-sm text-emerald-600/50 dark:text-emerald-300/50">
                            No contacts added
                          </TableCell>
                        </TableRow>
                      ) : (
                        contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="py-2 text-sm">{contact.name || '—'}</TableCell>
                            <TableCell className="py-2 text-sm">{contact.phoneNumber || '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-4 !bg-emerald-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-emerald-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-4 !bg-emerald-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-emerald-500"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Contact List</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100/50 dark:border-emerald-800/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
                    New Contact Name
                  </Label>
                  <Input
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
                    placeholder="Enter contact name..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75">
                    Phone Number
                  </Label>
                  <PhoneInput
                    value={newContactPhone}
                    onChange={setNewContactPhone}
                    onKeyPress={handleKeyPress}
                    className="!bg-white/80 dark:!bg-gray-900/50 !border-emerald-100/50 dark:!border-emerald-800/50 shadow-sm"
                  />
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={addContact}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/80 dark:bg-gray-900/50 border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
              />

              <div className="rounded-lg border border-emerald-100/50 dark:border-emerald-800/50 overflow-hidden">
                <div className={`overflow-y-auto ${filteredContacts.length > 4 ? 'max-h-[320px]' : ''}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75 sticky top-0 bg-background z-10">Name</TableHead>
                        <TableHead className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75 sticky top-0 bg-background z-10">Phone</TableHead>
                        <TableHead className="text-xs font-medium text-emerald-600/75 dark:text-emerald-300/75 w-[100px] sticky top-0 bg-background z-10">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-emerald-600/50 dark:text-emerald-300/50">
                            {contacts.length === 0 ? "No contacts added" : "No contacts match your search"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="py-2">
                              <Input
                                value={contact.name}
                                onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                                className="bg-transparent border-transparent hover:border-input focus:border-input h-8"
                                placeholder="Enter name..."
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <PhoneInput
                                value={contact.phoneNumber}
                                onChange={(value) => updateContact(contact.id, 'phoneNumber', value)}
                                className="!bg-transparent !border-transparent hover:!border-input focus:!border-input"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => removeContact(contact.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
