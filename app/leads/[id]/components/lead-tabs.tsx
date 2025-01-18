'use client';

import { Lead, LeadCommunication, LeadReminder, LeadNote, Attachment } from '@/app/types/lead';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Globe, Users, Tag } from 'lucide-react';
import LeadOverview from './tabs/lead-overview';
import LeadCommunications from './tabs/lead-communications';
import LeadReminders from './tabs/lead-reminders';
import LeadNotes from './tabs/lead-notes';
import LeadAttachments from './tabs/lead-attachments';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LeadTabsProps {
  lead: Lead & {
    communications: LeadCommunication[];
    reminders: LeadReminder[];
    lead_notes: LeadNote[];
    attachments: Attachment[];
    venue?: {
      title: string;
      address?: string;
      address2?: string;
      city?: string;
      state?: string;
      zip?: string;
      phone?: string;
      website?: string;
      capacity?: number;
      venue_types?: string[];
    };
  };
  onUpdate: () => Promise<void>;
}

export default function LeadTabs({ lead, onUpdate }: LeadTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'communications', label: 'Communications', count: lead.communications.length },
    { id: 'reminders', label: 'Reminders', count: lead.reminders.length },
    { id: 'notes', label: 'Notes', count: lead.lead_notes.length },
    { id: 'attachments', label: 'Attachments', count: lead.attachments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Description Section */}
      <section className="bg-[#1B2559] border border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <p className="text-gray-300">{lead.description || 'No description provided.'}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details Panel */}
        <section className="bg-[#1B2559] border border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Type</span>
              <span>{lead.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Company</span>
              <span>{lead.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Contact</span>
              <span>{lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString() : 'Not contacted'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated</span>
              <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        {/* Venue Data Panel */}
        <section className="bg-[#1B2559] border border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Venue Information</h2>
          <div className="space-y-4">
            {lead.venue_id ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Name</span>
                  <span>{lead.venue?.title || 'N/A'}</span>
                </div>
                {lead.venue?.address && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Address
                    </span>
                    <span>{lead.venue.address}</span>
                  </div>
                )}
                {lead.venue?.address2 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Address 2
                    </span>
                    <span>{lead.venue.address2}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    Location
                  </span>
                  <span>
                    {[
                      lead.venue?.city,
                      lead.venue?.state,
                      lead.venue?.zip
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
                {lead.venue?.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      Phone
                    </span>
                    <span>{lead.venue.phone}</span>
                  </div>
                )}
                {lead.venue?.website && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      Website
                    </span>
                    <a href={lead.venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      {lead.venue.website}
                    </a>
                  </div>
                )}
                {lead.venue?.capacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      Capacity
                    </span>
                    <span>{lead.venue.capacity.toLocaleString()}</span>
              </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-center">No venue assigned</p>
            )}
          </div>
        </section>
      </div>

      {/* Tags Section */}
      <section className="bg-[#1B2559] border border-blue-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {lead.venue?.venue_types?.map((tag, index) => (
            <span key={`venue-${index}`} className="px-3 py-1 bg-[#111C44] rounded-full text-sm text-blue-400 flex items-center">
              <Tag className="h-4 w-4 mr-1.5" />
              {tag}
            </span>
          ))}
          {lead.tags?.map((tag, index) => (
            <span key={`lead-${index}`} className="px-3 py-1 bg-[#111C44] rounded-full text-sm text-blue-400 flex items-center">
              <Tag className="h-4 w-4 mr-1.5" />
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex justify-center space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-4 px-1 text-md font-medium whitespace-nowrap relative transition-all duration-200",
                "hover:text-lg",
                activeTab === tab.id
                  ? "text-white text-lg after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-blue-500 after:transform after:scale-x-100 after:transition-transform after:duration-300"
                  : "text-gray-400 hover:text-white after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-gray-300 after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
              )}
            >
              <span className="relative z-10 transition-all duration-200">
                {tab.label} <span className="text-sm ml-1 opacity-75">({tab.count})</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'communications' && (
          <Card className="border border-blue-800 bg-[#1B2559]">
            <LeadCommunications lead={lead} />
          </Card>
        )}
        {activeTab === 'reminders' && (
          <Card className="border border-blue-800 bg-[#1B2559]">
            <LeadReminders lead={lead} />
          </Card>
        )}
        {activeTab === 'notes' && (
          <Card className="border border-blue-800 bg-[#1B2559]">
            <LeadNotes lead={lead} />
          </Card>
        )}
        {activeTab === 'attachments' && (
          <Card className="border border-blue-800 bg-[#1B2559]">
            <LeadAttachments lead={lead} />
          </Card>
        )}
      </div>
    </div>
  );
} 