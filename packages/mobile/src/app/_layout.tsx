import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import { Stack } from 'expo-router/stack'
import { BookProvider } from '~/book/provider.tsx'
import { useColorScheme } from 'react-native'

export default function RootLayout() {
	const colorScheme = useColorScheme()

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<BookProvider>
				<Stack>
					<Stack.Screen
						name='books/[book-id]/(tabs)'
						options={{ title: 'Family' }}
					/>
					<Stack.Screen
						name='prototype/native-ui'
						options={{ headerShown: false }}
					/>
				</Stack>
			</BookProvider>
		</ThemeProvider>
	)
}
