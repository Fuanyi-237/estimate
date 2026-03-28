import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { listCustomers, upsertCustomer } from '../db/repo';
import type { Customer } from '../types';

export default function CustomersScreen() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');

  const load = React.useCallback(async () => {
    const c = await listCustomers();
    setCustomers(c);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Customers" subtitle="Saved on device" />
        <Card.Content style={{ gap: 8 }}>
          <TextInput label="Name" value={name} onChangeText={setName} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Button
            mode="contained"
            onPress={async () => {
              const trimmed = name.trim();
              if (!trimmed) return;
              try {
                await upsertCustomer({ name: trimmed, phone: phone.trim() || null, email: email.trim() || null });
                setName('');
                setPhone('');
                setEmail('');
                await load();
              } catch (e: any) {
                Alert.alert('Cannot save customer', e?.message ?? 'Unknown error');
              }
            }}
          >
            Add customer
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Saved customers" />
        <Card.Content style={{ gap: 10 }}>
          {customers.length === 0 ? <Text>No customers yet.</Text> : null}
          {customers.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium">{c.name}</Text>
                {c.phone ? <Text variant="bodySmall">{c.phone}</Text> : null}
                {c.email ? <Text variant="bodySmall">{c.email}</Text> : null}
              </View>
              <IconButton
                icon="pencil-outline"
                onPress={() => {
                  Alert.alert('Edit not in MVP', 'For now, create a new record if needed.');
                }}
              />
            </View>
          ))}
          <Divider />
          <Text variant="bodySmall">Tip: In the editor, you can pick one of these customers.</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
