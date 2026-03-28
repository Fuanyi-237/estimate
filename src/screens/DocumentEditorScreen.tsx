import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import type { DocumentsStackParamList } from '../navigation/types';
import type { Customer, Document, DocumentType, LineItem, Unit } from '../types';
import {
  addLineItem,
  deleteLineItem,
  getDocument,
  listCustomers,
  listLineItems,
  listUnits,
  updateDocument,
  updateLineItem,
} from '../db/repo';
import { toNumber } from '../utils/money';
import { calcTotals } from '../utils/totals';
import { exportDocumentPdf } from '../utils/pdf';

export default function DocumentEditorScreen({
  route,
  navigation,
}: {
  route: RouteProp<DocumentsStackParamList, 'DocumentEditor'>;
  navigation: any;
}) {
  const { id } = route.params;

  const [doc, setDoc] = React.useState<Document | null>(null);
  const [items, setItems] = React.useState<LineItem[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);

  const [unitPicker, setUnitPicker] = React.useState<{ itemId: number } | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const [d, li, u, c] = await Promise.all([
      getDocument(id),
      listLineItems(id),
      listUnits(),
      listCustomers(),
    ]);
    setDoc(d);
    setItems(li);
    setUnits(u);
    setCustomers(c);
    if (d) navigation.setOptions({ title: d.number });
  }, [id, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load])
  );

  if (!doc) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const totals = calcTotals(items, doc.taxRate, doc.discountRate);

  async function patchDoc(patch: Partial<Document>) {
    const next = { ...doc, ...patch };
    setDoc(next);
    await updateDocument({ id: doc.id, ...patch });
  }

  async function onAddItem() {
    const defaultUnit = units[0];
    if (!defaultUnit) {
      Alert.alert('No units found', 'Go to Units tab and add a unit.');
      return;
    }
    const newId = await addLineItem(doc.id, {
      name: 'New item',
      qty: 1,
      unitId: defaultUnit.id,
      unitName: defaultUnit.name,
      unitPrice: 0,
      category: null,
    });
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        documentId: doc.id,
        name: 'New item',
        qty: 1,
        unitId: defaultUnit.id,
        unitName: defaultUnit.name,
        unitPrice: 0,
        category: null,
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Portal>
        <Dialog visible={customerPickerOpen} onDismiss={() => setCustomerPickerOpen(false)}>
          <Dialog.Title>Select customer</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 8 }}>
              <List.Item
                title="None"
                onPress={async () => {
                  setCustomerPickerOpen(false);
                  await patchDoc({ customerId: null, customerName: null });
                }}
              />
              {customers.map((c) => (
                <List.Item
                  key={c.id}
                  title={c.name}
                  description={[c.phone, c.email].filter(Boolean).join(' • ')}
                  onPress={async () => {
                    setCustomerPickerOpen(false);
                    await patchDoc({ customerId: c.id, customerName: c.name });
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCustomerPickerOpen(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!unitPicker} onDismiss={() => setUnitPicker(null)}>
          <Dialog.Title>Select unit</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {units.map((u) => (
                <List.Item
                  key={u.id}
                  title={u.name}
                  description={u.isDefault ? 'Default' : undefined}
                  onPress={async () => {
                    const targetId = unitPicker?.itemId;
                    setUnitPicker(null);
                    if (!targetId) return;
                    const it = items.find((x) => x.id === targetId);
                    if (!it) return;
                    const patch = { unitId: u.id, unitName: u.name };
                    const next = { ...it, ...patch };
                    setItems((prev) => prev.map((x) => (x.id === targetId ? next : x)));
                    await updateLineItem({ id: targetId, ...patch });
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setUnitPicker(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}>
        <Card>
          <Card.Title title={doc.type === 'quote' ? 'Quote' : 'Invoice'} subtitle={doc.number} />
          <Card.Content style={{ gap: 10 }}>
            <SegmentedButtons
              value={doc.type}
              onValueChange={(v) => patchDoc({ type: v as DocumentType })}
              buttons={[
                { value: 'quote', label: 'Quote' },
                { value: 'invoice', label: 'Invoice' },
              ]}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Text variant="titleSmall">Customer</Text>
              <Button mode="outlined" onPress={() => setCustomerPickerOpen(true)}>
                {doc.customerName ? doc.customerName : 'Pick'}
              </Button>
            </View>

            <TextInput
              mode="outlined"
              label="Currency"
              value={doc.currency}
              onChangeText={(t) => patchDoc({ currency: t.trim() || 'XAF' })}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                mode="outlined"
                style={{ flex: 1 }}
                label="Tax %"
                value={String(doc.taxRate)}
                keyboardType="numeric"
                onChangeText={(t) => patchDoc({ taxRate: toNumber(t, 0) })}
              />
              <TextInput
                mode="outlined"
                style={{ flex: 1 }}
                label="Discount %"
                value={String(doc.discountRate)}
                keyboardType="numeric"
                onChangeText={(t) => patchDoc({ discountRate: toNumber(t, 0) })}
              />
            </View>

            <TextInput
              mode="outlined"
              label="Notes"
              value={doc.notes ?? ''}
              onChangeText={(t) => patchDoc({ notes: t })}
              multiline
            />

            <Button
              mode="contained"
              icon="share-variant-outline"
              onPress={async () => {
                const freshDoc = await getDocument(doc.id);
                const freshItems = await listLineItems(doc.id);
                if (!freshDoc) return;
                await exportDocumentPdf(freshDoc, freshItems);
              }}
            >
              Export PDF
            </Button>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title="Items" />
          <Card.Content style={{ gap: 12 }}>
            {items.length === 0 ? <Text>No items yet. Add one.</Text> : null}

            {items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                currency={doc.currency}
                onPickUnit={() => setUnitPicker({ itemId: it.id })}
                onChange={async (patch) => {
                  const next = { ...it, ...patch };
                  setItems((prev) => prev.map((x) => (x.id === it.id ? next : x)));
                  await updateLineItem({ id: it.id, ...patch });
                }}
                onDelete={async () => {
                  await deleteLineItem(it.id);
                  setItems((prev) => prev.filter((x) => x.id !== it.id));
                }}
              />
            ))}

            <Divider />
            <View style={{ gap: 4 }}>
              <Text>Subtotal: {totals.subtotal.toFixed(2)} {doc.currency}</Text>
              <Text>Discount: -{totals.discount.toFixed(2)} {doc.currency}</Text>
              <Text>Tax: {totals.tax.toFixed(2)} {doc.currency}</Text>
              <Text variant="titleMedium">Total: {totals.total.toFixed(2)} {doc.currency}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
        }}
      >
        <Button mode="contained" icon="plus" onPress={onAddItem} contentStyle={{ height: 48 }}>
          Add item
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

function ItemRow({
  item,
  currency,
  onPickUnit,
  onChange,
  onDelete,
}: {
  item: LineItem;
  currency: string;
  onPickUnit: () => void;
  onChange: (patch: Partial<LineItem>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  return (
    <Card mode="outlined">
      <Card.Content style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="titleSmall">Line</Text>
          <IconButton icon="delete-outline" onPress={() => void onDelete()} />
        </View>

        <TextInput
          mode="outlined"
          label="Item name"
          value={item.name}
          onChangeText={(t) => void onChange({ name: t })}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            mode="outlined"
            style={{ flex: 1 }}
            label="Qty"
            value={String(item.qty)}
            keyboardType="numeric"
            onChangeText={(t) => void onChange({ qty: toNumber(t, 0) })}
          />

          <Button
            style={{ alignSelf: 'flex-end' }}
            mode="outlined"
            onPress={onPickUnit}
          >
            {item.unitName}
          </Button>
        </View>

        <TextInput
          mode="outlined"
          label={`Unit price (${currency})`}
          value={String(item.unitPrice)}
          keyboardType="numeric"
          onChangeText={(t) => void onChange({ unitPrice: toNumber(t, 0) })}
        />

        <Text variant="bodySmall">Amount: {(item.qty * item.unitPrice).toFixed(2)} {currency}</Text>
      </Card.Content>
    </Card>
  );
}
