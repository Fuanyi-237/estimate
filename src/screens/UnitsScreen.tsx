import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { addUnit, deleteUnit, listUnits } from '../db/repo';
import type { Unit } from '../types';

export default function UnitsScreen() {
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [name, setName] = React.useState('');

  const load = React.useCallback(async () => {
    const u = await listUnits();
    setUnits(u);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Units" subtitle="Default + your saved units" />
        <Card.Content style={{ gap: 8 }}>
          <TextInput label="Add unit" value={name} onChangeText={setName} />
          <Button
            mode="contained"
            onPress={async () => {
              const trimmed = name.trim();
              if (!trimmed) return;
              try {
                await addUnit(trimmed);
                setName('');
                await load();
              } catch (e: any) {
                Alert.alert('Cannot add unit', e?.message ?? 'Unknown error');
              }
            }}
          >
            Save unit
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Available units" />
        <Card.Content style={{ gap: 10 }}>
          {units.map((u) => (
            <View
              key={u.id}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Chip>{u.name}</Chip>
                {u.isDefault ? <Text variant="bodySmall">Default</Text> : null}
              </View>
              <IconButton
                icon="delete-outline"
                disabled={u.isDefault}
                onPress={() => {
                  Alert.alert('Delete unit?', `Remove "${u.name}" from your saved units?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteUnit(u.id);
                        await load();
                      },
                    },
                  ]);
                }}
              />
            </View>
          ))}
          <Divider />
          <Text variant="bodySmall">
            Note: Default units cannot be deleted. Your custom units will show in the Units dropdown when
            adding items.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
