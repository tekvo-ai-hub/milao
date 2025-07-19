import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const makeFirstAdmin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'make_first_admin',
          email: email.trim()
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: data.message,
      });
      
      setEmail('');
      setIsOpen(false);
      
      // Refresh the page to update admin status
      window.location.reload();
    } catch (error) {
      console.error('Error making first admin:', error);
      toast({
        title: "Error",
        description: "Failed to grant admin privileges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Setup First Admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Grant Admin Privileges
          </DialogTitle>
          <DialogDescription>
            Grant admin privileges to the first user. This can only be done once.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Admin Setup</CardTitle>
            <CardDescription>
              Enter the email address of the user who should become the first admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            
            <Button 
              onClick={makeFirstAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Granting Admin Access...' : 'Make Admin'}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSetup;