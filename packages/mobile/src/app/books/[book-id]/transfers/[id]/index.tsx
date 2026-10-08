import { useLocalSearchParams } from 'expo-router'
import { TransferDetailScreen } from '~/screens/prototype-overview.tsx'
export default function TransferRoute() {
	const params = useLocalSearchParams<{ 'book-id': string; id: string }>()
	return (
		<TransferDetailScreen
			bookId={params['book-id']}
			id={params.id}
		/>
	)
}
