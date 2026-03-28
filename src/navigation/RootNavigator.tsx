import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { DocumentsStackParamList, RootTabsParamList } from './types';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentEditorScreen from '../screens/DocumentEditorScreen';
import CustomersScreen from '../screens/CustomersScreen';
import UnitsScreen from '../screens/UnitsScreen';

const Tabs = createBottomTabNavigator<RootTabsParamList>();
const DocsStack = createNativeStackNavigator<DocumentsStackParamList>();

function DocumentsStack() {
  return (
    <DocsStack.Navigator>
      <DocsStack.Screen name="DocumentsHome" component={DocumentsScreen} options={{ title: 'SmartQuote' }} />
      <DocsStack.Screen name="DocumentEditor" component={DocumentEditorScreen} options={{ title: 'Edit' }} />
    </DocsStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const icon =
              route.name === 'DocumentsTab'
                ? 'file-document-edit-outline'
                : route.name === 'CustomersTab'
                  ? 'account-group-outline'
                  : 'tape-measure';
            return <MaterialCommunityIcons name={icon as any} color={color} size={size} />;
          },
        })}
      >
        <Tabs.Screen name="DocumentsTab" component={DocumentsStack} options={{ title: 'Docs' }} />
        <Tabs.Screen name="CustomersTab" component={CustomersScreen} options={{ title: 'Customers' }} />
        <Tabs.Screen name="UnitsTab" component={UnitsScreen} options={{ title: 'Units' }} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
