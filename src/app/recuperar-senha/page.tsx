'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Key, Loader2, ArrowLeft } from 'lucide-react';
import { requestPasswordResetAction } from '@/actions/authActions';

const requestSchema = z.object({
  email_prefix: z.string().min(1, { message: "Por favor, insira o início do seu e-mail." }),
});
type RequestFormData = z.infer<typeof requestSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Enviando..." : "Enviar E-mail de Recuperação"}
    </Button>
  );
}

export default function RecuperarSenhaPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email_prefix: '' },
  });

  const [state, formAction] = useFormState(requestPasswordResetAction, {
    success: false,
    message: '',
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Verifique seu E-mail" : "Ocorreu um Erro",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
      if(state.success) {
        form.reset();
      }
    }
  }, [state, toast, form]);
  
  const handleFormSubmit = form.handleSubmit(() => {
    if (formRef.current) {
        formAction(new FormData(formRef.current));
    }
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
            <Key className="h-8 w-8" /> Recuperar Senha
          </CardTitle>
          <CardDescription>
            Digite seu e-mail para receber o link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            ref={formRef} 
            action={formAction}
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email_prefix" className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground"/> E-mail</Label>
              <div className="flex items-center">
                  <Input 
                    id="email_prefix"
                    {...form.register("email_prefix")}
                    placeholder="usuario" 
                    className="rounded-r-none focus:z-10"
                  />
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-l-0 border-input rounded-r-md h-10">
                      @portovaleconsorcios.com.br
                  </span>
              </div>
              {form.formState.errors.email_prefix && <p className="text-sm font-medium text-destructive">{form.formState.errors.email_prefix.message}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter>
            <Button variant="outline" asChild className="w-full">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
