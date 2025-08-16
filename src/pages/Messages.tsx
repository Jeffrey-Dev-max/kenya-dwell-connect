import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Send, 
  Paperclip,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  property_id: string;
  created_at: string;
  property: {
    title: string;
    town: string;
    county: string;
  };
  other_participant: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  sender: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          property:properties(title, town, county),
          participant_a_profile:profiles!participant_a(id, display_name, avatar_url),
          participant_b_profile:profiles!participant_b(id, display_name, avatar_url)
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform conversations to include other participant info
      const transformedConversations = data?.map(conv => ({
        ...conv,
        other_participant: conv.participant_a === user.id 
          ? conv.participant_b_profile 
          : conv.participant_a_profile
      })) || [];

      setConversations(transformedConversations as any);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            fetchMessages(selectedConversation.id);
          }
          fetchConversations(); // Refresh conversations list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user) return;

    try {
      setSendingMessage(true);
      
      const otherParticipantId = selectedConversation.participant_a === user.id 
        ? selectedConversation.participant_b 
        : selectedConversation.participant_a;

      const { error } = await supabase.functions.invoke('send-message', {
        body: {
          property_id: selectedConversation.property_id,
          receiver_id: otherParticipantId,
          content: newMessage
        }
      });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_participant?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 h-[calc(100vh-10rem)]">
          <div className="flex h-full gap-6">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-1/3`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No conversations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-4">
                        {filteredConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedConversation?.id === conversation.id
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.other_participant?.avatar_url} />
                                <AvatarFallback>
                                  {conversation.other_participant?.display_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-foreground truncate">
                                    {conversation.other_participant?.display_name || 'Unknown User'}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(conversation.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {conversation.property?.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {conversation.property?.town}, {conversation.property?.county}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} w-full lg:w-2/3`}>
              {selectedConversation ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.other_participant?.avatar_url} />
                        <AvatarFallback>
                          {selectedConversation.other_participant?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation.other_participant?.display_name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription>
                          {selectedConversation.property?.title} - {selectedConversation.property?.town}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="border-t p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={sendingMessage}
                      />
                      <Button variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || sendingMessage}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;