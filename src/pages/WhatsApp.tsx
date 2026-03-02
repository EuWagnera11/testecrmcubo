import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppInbox } from '@/components/whatsapp/WhatsAppInbox';
import { WhatsAppInstances } from '@/components/whatsapp/WhatsAppInstances';
import { QuickRepliesManager } from '@/components/whatsapp/QuickRepliesManager';
import { MessageSquare, Settings2, FileText } from 'lucide-react';

export default function WhatsApp() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie conversas com seus leads</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 border-b">
          <TabsList className="h-10">
            <TabsTrigger value="inbox" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="instances" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Conexões
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inbox" className="flex-1 overflow-hidden mt-0">
          <WhatsAppInbox />
        </TabsContent>

        <TabsContent value="templates" className="flex-1 overflow-auto mt-0 p-6">
          <QuickRepliesManager />
        </TabsContent>

        <TabsContent value="instances" className="flex-1 overflow-auto mt-0 p-6">
          <WhatsAppInstances />
        </TabsContent>
      </Tabs>
    </div>
  );
}
