
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/contexts/TicketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, Link as LinkIcon, Loader2, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { TICKET_REASONS } from '@/lib/constants';
import type { ReasonAssignment } from '@/types';
import { Button } from './ui/button';
import { MultiSelect, OptionType } from './ui/multi-select';


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

const AssignmentRow = ({
  reason,
  assignments,
  attendants,
  onAssignmentChange,
}: {
  reason: { value: string; label: string };
  assignments: ReasonAssignment[];
  attendants: Profile[];
  onAssignmentChange: (reason: string, usernames: string[]) => Promise<void>;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const attendantOptions: OptionType[] = useMemo(() => 
    attendants.map(attendant => ({
        value: attendant.username,
        label: attendant.username,
    })), [attendants]);

  const selectedUsernames = useMemo(() => 
    assignments
      .filter(a => a.reason === reason.value)
      .map(a => a.username),
    [assignments, reason.value]
  );

  const handleSelectionChange = async (newSelection: string[]) => {
      setIsUpdating(true);
      await onAssignmentChange(reason.value, newSelection);
      setIsUpdating(false);
  };
  
  return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0 gap-4">
          <Label htmlFor={`reason-${reason.value}`} className="font-normal text-base shrink-0">{reason.label}</Label>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              {isUpdating && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              <MultiSelect
                  options={attendantOptions}
                  selected={selectedUsernames}
                  onChange={handleSelectionChange}
                  className="w-full sm:min-w-[250px]"
                  placeholder="Atribuir..."
                  disabled={isUpdating}
              />
          </div>
      </div>
  );
};


export function ConfiguracoesClient() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<ReasonAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { fetchReasonAssignments, updateReasonAssignment } = useTickets();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('id, username, is_active_in_queue')
        .eq('cargo', 'gre')
        .order('username', { ascending: true });

      const assignmentPromise = fetchReasonAssignments();

      const [profileResult, assignmentResult] = await Promise.all([profilePromise, assignmentPromise]);
      
      if (profileResult.error) throw profileResult.error;
      
      setProfiles(profileResult.data || []);
      setAssignments(assignmentResult || []);

    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao buscar dados de configuração:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchReasonAssignments]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('update_attendant_status', {
        p_user_id: id,
        p_is_active: newStatus
      });

      if (error) throw error;
      
      toast({
        title: "Status atualizado!",
        description: `O atendente foi ${newStatus ? 'ativado' : 'desativado'} na fila.`,
      });
      await fetchInitialData();

    } catch (err: any) {
       toast({
        title: "Erro ao atualizar",
        description: err.message || "Não foi possível alterar o status do atendente.",
        variant: "destructive"
      });
      console.error("Erro ao atualizar status:", err);
    }
  };

  const handleAssignmentChange = async (reason: string, usernames: string[]) => {
    const success = await updateReasonAssignment(reason, usernames);
    if (success) {
      await fetchInitialData(); 
    }
  };

  if (isLoading) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
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
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 border-b">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-10 w-52" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
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
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6"/> Fila de Atendimento</CardTitle>
                <CardDescription>
                    Ative ou desative os atendentes que receberão tickets distribuídos automaticamente no rodízio (round-robin).
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
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon className="h-6 w-6"/>Atribuição por Motivo</CardTitle>
                <CardDescription>
                    Associe motivos de ticket específicos a um ou mais atendentes. Isso ignora o rodízio geral para aquele motivo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {TICKET_REASONS.length > 0 && profiles.length > 0 ? (
                    <div className="border rounded-md">
                      {TICKET_REASONS.map(reason => (
                          <AssignmentRow
                            key={reason.value}
                            reason={reason}
                            assignments={assignments}
                            attendants={profiles}
                            onAssignmentChange={handleAssignmentChange}
                          />
                      ))}
                    </div>
                 ) : (
                    <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md">
                        <p className="text-sm text-muted-foreground text-center p-4">Nenhum motivo de ticket ou atendente encontrado para configurar.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}
