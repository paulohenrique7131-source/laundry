import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { canEditNote, filterNotes, isUnreadTargetedNote, type Note } from '@laundry/domain';
import { AppInput, AppScreen, Button, Chip, EmptyState, ErrorState, FieldLabel, GlassCard, LoadingState, ScreenHeader } from '@/components/ui';
import { repository } from '@/lib/repository';
import { useAuth } from '@/providers/AuthProvider';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';

type NotesFilter = 'all' | 'mine' | 'received';

export default function NotesScreen() {
  const { theme } = useApp();
  const { role, userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotesFilter>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'targeted'>('private');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<'save' | 'delete' | 'read' | null>(null);

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => repository.getNotes(),
  });
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => repository.getUsers(),
  });

  const notes = notesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const filteredNotes = useMemo(() => filterNotes(notes, filter, userId), [filter, notes, userId]);

  const refreshNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['notes'] });
    await notesQuery.refetch();
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditing(note);
      setContent(note.content);
      setVisibility(note.visibility);
      setSelectedRecipients(note.recipients ?? []);
    } else {
      setEditing(null);
      setContent('');
      setVisibility('private');
      setSelectedRecipients([]);
    }
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setContent('');
    setVisibility('private');
    setSelectedRecipients([]);
  };

  const saveNote = async () => {
    if (!content.trim() || !userId) {
      toast('A nota nao pode ficar vazia.', 'error');
      return;
    }

    try {
      setBusyAction('save');
      if (editing) {
        await repository.updateNote({
          ...editing,
          content,
          visibility,
          recipients: visibility === 'targeted' ? selectedRecipients : [],
          updatedAt: new Date().toISOString(),
        });
        toast('Nota atualizada.');
      } else {
        await repository.addNote({
          id: uuidv4(),
          content,
          authorId: userId,
          authorRole: role ?? undefined,
          visibility,
          recipients: visibility === 'targeted' ? selectedRecipients : [],
          readBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast('Nota criada.');
      }

      closeEditor();
      await refreshNotes();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel salvar a nota.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      setBusyAction('delete');
      await repository.deleteNote(id);
      await refreshNotes();
      toast('Nota excluida.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel excluir a nota.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const markAsRead = async (note: Note) => {
    try {
      setBusyAction('read');
      await repository.markNoteAsRead(note.id);
      await refreshNotes();
      toast('Marcado como lido.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel marcar a nota como lida.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const loading = notesQuery.isLoading || usersQuery.isLoading;
  const error = notesQuery.error ?? usersQuery.error;

  return (
    <>
      <AppScreen>
        <ScreenHeader
          title="Quadro de Avisos"
          subtitle="Comunicados publicos, privados e mensagens direcionadas."
          right={<Button label="Nova nota" onPress={() => openEditor()} />}
        />

        <GlassCard style={{ gap: 12 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Filtro</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {([
              ['all', 'Todas'],
              ['mine', 'Minhas'],
              ['received', 'Recebidas'],
            ] as const).map(([value, label]) => (
              <Chip key={value} label={label} active={filter === value} onPress={() => setFilter(value)} />
            ))}
          </View>
        </GlassCard>

        {loading ? <LoadingState label="Carregando notas..." /> : null}
        {!loading && error ? (
          <ErrorState
            title="Falha ao carregar notas"
            subtitle={error instanceof Error ? error.message : 'Nao foi possivel obter notas e usuarios.'}
            onRetry={() => {
              void notesQuery.refetch();
              void usersQuery.refetch();
            }}
          />
        ) : null}
        {!loading && !error && filteredNotes.length === 0 ? (
          <EmptyState title="Nenhuma nota encontrada" subtitle="Crie uma nova nota ou ajuste o filtro atual." />
        ) : null}

        {!error && filteredNotes.map((note) => {
          const unread = isUnreadTargetedNote(note, userId);
          const mine = canEditNote(note, userId);
          return (
            <GlassCard key={note.id} style={{ gap: 12, borderColor: unread ? '#ef4444' : theme.colors.glassBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                    {note.visibility === 'public' ? 'Publico' : note.visibility === 'targeted' ? 'Mensagem Direta' : 'Privado'}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    {new Date(note.createdAt).toLocaleDateString('pt-BR')} - {note.authorRole === 'manager' ? 'Gerencia' : note.authorRole === 'gov' ? 'Governanca' : 'Sistema'}
                  </Text>
                </View>
                {unread ? (
                  <View style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Nova</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 }}>{note.content}</Text>

              {note.visibility === 'targeted' ? (
                mine ? (
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    Lido por {note.readBy?.length ?? 0} de {note.recipients?.length ?? 0}
                  </Text>
                ) : unread ? (
                  <Button label="Marcar como lido" onPress={() => { void markAsRead(note); }} variant="secondary" loading={busyAction === 'read'} fullWidth />
                ) : (
                  <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700' }}>Lida</Text>
                )
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {mine ? <Button label="Editar" onPress={() => openEditor(note)} variant="secondary" /> : null}
                {mine ? (
                  <Button
                    label="Excluir"
                    onPress={() => Alert.alert('Excluir nota', 'Essa nota sera removida permanentemente.', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => void deleteNote(note.id) },
                    ])}
                    variant="danger"
                    loading={busyAction === 'delete'}
                  />
                ) : null}
              </View>
            </GlassCard>
          );
        })}
      </AppScreen>

      <Modal animationType="slide" visible={editorOpen} onRequestClose={closeEditor}>
        <View style={{ backgroundColor: theme.colors.bgPrimary, flex: 1, padding: 16, paddingTop: 56 }}>
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
            <ScreenHeader title={editing ? 'Editar nota' : 'Nova nota'} subtitle="Mesmo fluxo de visibilidade do web." right={<Button label="Fechar" onPress={closeEditor} variant="ghost" />} />
            <View>
              <FieldLabel>Conteudo</FieldLabel>
              <AppInput
                multiline
                numberOfLines={6}
                style={{ minHeight: 150, textAlignVertical: 'top' }}
                value={content}
                onChangeText={setContent}
                placeholder="Escreva sua mensagem"
              />
            </View>
            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Visibilidade</Text>
              <View style={{ gap: 10 }}>
                {([
                  ['private', 'Privado'],
                  ['public', 'Publico'],
                  ['targeted', 'Mensagem Direta'],
                ] as const).map(([value, label]) => (
                  <Pressable key={value} onPress={() => setVisibility(value)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{label}</Text>
                    <Switch value={visibility === value} onValueChange={(enabled) => { if (enabled) setVisibility(value); }} thumbColor={theme.colors.accent} />
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            {visibility === 'targeted' ? (
              <GlassCard style={{ gap: 12 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Destinatarios</Text>
                {users.filter((item) => item.id !== userId).map((item) => {
                  const selected = selectedRecipients.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedRecipients((current) => selected ? current.filter((entry) => entry !== item.id) : [...current, item.id])}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <View>
                        <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{item.email}</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{item.role}</Text>
                      </View>
                      <Switch value={selected} onValueChange={() => setSelectedRecipients((current) => selected ? current.filter((entry) => entry !== item.id) : [...current, item.id])} thumbColor={theme.colors.accent} />
                    </Pressable>
                  );
                })}
              </GlassCard>
            ) : null}

            <Button label={editing ? 'Salvar alteracoes' : 'Criar nota'} onPress={saveNote} loading={busyAction === 'save'} fullWidth />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

