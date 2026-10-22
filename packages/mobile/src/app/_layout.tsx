import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BookProvider, useBookStatus } from '~/book/provider.tsx'
import { colors, styles } from '~/ui.tsx'

function Content() {
	const { ready, error } = useBookStatus()
	if (error) {
		return (
			<SafeAreaView style={styles.screen}>
				<View style={styles.content}>
					<Text style={styles.sectionTitle}>Cannot open the Book</Text>
					<Text style={styles.body}>{error}</Text>
				</View>
			</SafeAreaView>
		)
	}
	if (!ready) {
		return <ActivityIndicator style={styles.screen} />
	}
	return (
		<Stack
			screenOptions={{
				headerTintColor: colors.action,
				headerTitleStyle: { color: colors.ink },
				headerShadowVisible: false,
				headerLargeTitleShadowVisible: false,
				headerBackButtonDisplayMode: 'minimal',
				contentStyle: { backgroundColor: colors.group }
			}}
		>
			<Stack.Screen
				name='index'
				options={{ title: 'Sort of Budget', headerLargeTitle: true }}
			/>
			<Stack.Screen
				name='expense'
				options={{ title: 'Expense or income', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='balance'
				options={{ title: 'Bank balance', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='account'
				options={{ title: 'Account', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='reserve'
				options={{ title: 'Reserve', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='transfer'
				options={{ title: 'Transfer', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='rate'
				options={{ title: 'Exchange rate', presentation: 'modal' }}
			/>
			<Stack.Screen
				name='ai'
				options={{ title: 'AI on this device' }}
			/>
			<Stack.Screen
				name='settings'
				options={{ title: 'Rates and data' }}
			/>
		</Stack>
	)
}

export default function RootLayout() {
	return (
		<BookProvider>
			<StatusBar style='dark' />
			<Content />
		</BookProvider>
	)
}
