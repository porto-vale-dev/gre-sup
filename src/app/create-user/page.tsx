'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, KeyRound, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { createUserAction } from '@/actions/createUser';
import { createUserSchema, type CreateUserFormData } from '@/lib/schemas';

export default function CreateUserPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email_prefix: '',
      password: '',
      confirmPassword: '',
    }
  });
  
  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key as keyof CreateUserFormData]);
    });

    const result = await createUserAction(formData);

    toast({
        title: result.success ? "Sucesso!" : "Erro na Criação",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    
    if (result.success) {
        form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
            <UserPlus className="h-8 w-8" /> Criar Novo Usuário
          </CardTitle>
          <CardDescription>Preencha os dados para criar uma nova conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email_prefix">E-mail</Label>
              <div className="flex items-center">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md h-10">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input 
                    id="email_prefix"
                    {...form.register("email_prefix")}
                    placeholder="usuario" 
                    className="rounded-l-none rounded-r-none focus:z-10"
                    disabled={isSubmitting}
                  />
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-l-0 border-input rounded-r-md h-10">
                      @portovaleconsorcios.com.br
                  </span>
              </div>
               {form.formState.errors.email_prefix && <p className="text-sm font-medium text-destructive">{form.formState.errors.email_prefix.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" /> Senha</span>
              </Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                {...form.register("password")}
                disabled={isSubmitting}
              />
               {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-muted-foreground" /> Confirmar Senha</span>
              </Label>
              <Input 
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
                disabled={isSubmitting}
              />
               {form.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="outline" asChild className="w-full">
                <Link href="/">Voltar para o Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
