
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown, Loader2 } from 'lucide-react';
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Making admin request for:', email.trim());
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          action: 'make_first_admin',
          email: email.trim()
        }
      });

      console.log('Admin function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Error",
          description: `Failed to call admin function: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        console.error('Admin function returned error:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Admin privileges granted successfully",
        });
        
        setEmail('');
        setIsOpen(false);
        
        // Refresh the page to update admin status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: "Unexpected Response",
          description: "Received unexpected response from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error making first admin:', error);
      toast({
        title: "Error",
        description: `Failed to grant admin privileges: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            Grant admin privileges to the first user. This can only be done once. The user must have already signed up for an account.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Admin Setup</CardTitle>
            <CardDescription>
              Enter the email address of the user who should become the first admin. Make sure this user has already created an account.
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
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={makeFirstAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Granting Admin Access...
                </>
              ) : (
                'Make Admin'
              )}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSetup;
