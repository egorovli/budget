import { Tabs, useLocalSearchParams } from 'expo-router'
export default function BookTabsLayout() {
	const params = useLocalSearchParams<{ 'book-id': string }>()
	const initialParams = { 'book-id': params['book-id'] }
	return (
		<Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0060c0' }}>
			<Tabs.Screen
				initialParams={initialParams}
				name='index'
				options={{ title: 'Accounts' }}
			/>
			<Tabs.Screen
				initialParams={initialParams}
				name='activity'
				options={{ title: 'Activity' }}
			/>
			<Tabs.Screen
				initialParams={initialParams}
				name='more'
				options={{ title: 'More' }}
			/>
			<Tabs.Screen
				initialParams={initialParams}
				name='reserves'
				options={{ href: null }}
			/>
		</Tabs>
	)
}
