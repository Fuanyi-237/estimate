import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, FAB, Text } from 'react-native-paper';
import { useFocusEffect, type NavigationProp } from '@react-navigation/native';

import type { DocumentsStackParamList } from '../navigation/types';
import { createDocument, deleteDocument, listDocuments } from '../db/repo';
import type { Document } from '../types';

export default function DocumentsScreen({
  navigation,
}: {
  navigation: NavigationProp<DocumentsStackParamList>;
}) {
  const [docs, setDocs] = React.useState<Document[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const d = await listDocuments();
    setDocs(d);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {docs.length === 0 ? (
          <Card>
            <Card.Title title="Welcome" subtitle="Create your first quote or invoice" />
            <Card.Content>
              <Text variant="bodyMedium">
                Use the + button to create a document. Units are included on every item line.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {docs.map((doc) => (
          <Card key={doc.id} onPress={() => navigation.navigate('DocumentEditor', { id: doc.id })}>
            <Card.Title
              title={`${doc.type === 'quote' ? 'Quote' : 'Invoice'} ${doc.number}`}
              subtitle={doc.customerName || 'No customer'}
              right={() => (
                <Chip style={{ marginRight: 12 }}>
                  {doc.status}
                </Chip>
              )}
            />
            <Card.Content style={{ gap: 8 }}>
              <Text variant="bodySmall">{new Date(doc.createdAt).toLocaleString()}</Text>
              <Divider />
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  mode="text"
                  onPress={async () => {
                    await deleteDocument(doc.id);
                    await load();
                  }}
                >
                  Delete
                </Button>
                <Button mode="contained" onPress={() => navigation.navigate('DocumentEditor', { id: doc.id })}>
                  Open
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB.Group
        open={fabOpen}
        visible
        icon="plus"
        actions={[
          {
            icon: 'file-document-outline',
            label: 'New Quote',
            onPress: async () => {
              const id = await createDocument('quote');
              navigation.navigate('DocumentEditor', { id });
            },
          },
          {
            icon: 'receipt-text-outline',
            label: 'New Invoice',
            onPress: async () => {
              const id = await createDocument('invoice');
              navigation.navigate('DocumentEditor', { id });
            },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        style={{ position: 'absolute' }}
      />
    </View>
  );
}
