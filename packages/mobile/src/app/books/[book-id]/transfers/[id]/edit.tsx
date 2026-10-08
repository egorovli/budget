import { useLocalSearchParams } from 'expo-router'
import { TransferFormScreen } from '~/screens/prototype-forms.tsx'
export default function EditTransferRoute() {
	const params = useLocalSearchParams<{ 'book-id': string; id: string }>()
	return (
		<TransferFormScreen
			bookId={params['book-id']}
			id={params.id}
		/>
	)
}
