
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, UserCog, Users } from 'lucide-react';
import { Badge } from './ui/badge';

interface Profile {
  id: string;
  username: string;
  is_active_in_queue: boolean;
}

const AttendantRow = ({ profile, onStatusChange }: { profile: Profile; onStatusChange: (id: string, newStatus: boolean) => Promise<void> }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    await onStatusChange(profile.id, checked);
    setIsUpdating(false);
  };
  
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex flex-col">
        <span className="font-medium">{profile.username}</span>
        <Badge variant={profile.is_active_in_queue ? "default" : "secondary"} className="w-fit mt-1">
          {profile.is_active_in_queue ? "Ativo na fila" : "Inativo na fila"}
        </Badge>
      </div>
      <Switch
        checked={profile.is_active_in_queue}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        aria-label={`Ativar ou desativar ${profile.username} na fila`}
      />
    </div>
  );
};


export function ConfiguracoesClient() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, is_active_in_queue')
        .eq('cargo', 'gre')
        .order('username', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao buscar perfis:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active_in_queue: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Status atualizado!",
        description: `O atendente foi ${newStatus ? 'ativado' : 'desativado'} na fila.`,
      });
      // Re-fetch to get the latest state
      await fetchProfiles();

    } catch (err: any) {
       toast({
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status do atendente.",
        variant: "destructive"
      });
      console.error("Erro ao atualizar status:", err);
    }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                     <div key={i} className="flex items-center justify-between p-4 border-b">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-11" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
  }

  if (error) {
     return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6"/> Fila de Atendimento</CardTitle>
                <CardDescription>
                    Ative ou desative os atendentes que receberão tickets distribuídos automaticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {profiles.length > 0 ? (
                    <div className="border rounded-md">
                        {profiles.map(profile => (
                            <AttendantRow key={profile.id} profile={profile} onStatusChange={handleStatusChange} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">Nenhum atendente com o cargo 'gre' encontrado.</p>
                )}
            </CardContent>
        </Card>
         <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCog className="h-6 w-6"/>Atribuição por Motivo</CardTitle>
                <CardDescription>
                    Associe motivos de ticket específicos a atendentes. Esta funcionalidade está em desenvolvimento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md">
                    <p className="text-sm text-muted-foreground">Em breve...</p>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
