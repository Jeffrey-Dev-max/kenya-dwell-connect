import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  User,
  Home,
  Phone,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface Conversation {
  id: string;
  property_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  properties?: {
    title: string;
    county: string;
    town: string;
  };
  other_participant?: {
    full_name: string;
    phone_number: string;
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
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          properties(title, county, town),
          messages(content, created_at, sender_id)
        `)
        .or(`participant_a.eq.${user?.id},participant_b.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get participant details and latest messages
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const otherParticipantId = conv.participant_a === user?.id 
            ? conv.participant_b 
            : conv.participant_a;

          // Get other participant profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', otherParticipantId)
            .single();

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            other_participant: profile,
            last_message: latestMessage
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
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
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user?.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversation);
      fetchConversations(); // Refresh to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please sign in to access your messages.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground">Communicate with property owners and potential tenants</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No conversations yet</p>
                      <Link to="/properties">
                        <Button variant="outline" className="mt-2">
                          Browse Properties
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                            selectedConversation === conversation.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {conversation.other_participant?.full_name || 'Unknown User'}
                                </span>
                              </div>
                              {conversation.properties && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Home className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">
                                    {conversation.properties.title}
                                  </span>
                                </div>
                              )}
                              {conversation.last_message && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.last_message.content}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {conversation.last_message && 
                                new Date(conversation.last_message.created_at).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2">
              {selectedConversation && selectedConversationData ? (
                <>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5" />
                        <div>
                          <p className="font-medium">
                            {selectedConversationData.other_participant?.full_name || 'Unknown User'}
                          </p>
                          {selectedConversationData.properties && (
                            <p className="text-sm text-muted-foreground">
                              {selectedConversationData.properties.title}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedConversationData.other_participant?.phone_number && (
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-0 flex flex-col h-[400px]">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="border-t p-4">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the left to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;