import type { TabProps } from './ClienteModal';

// TODO: ligar no vendaService.
// Se getVendas aceitar clientId, dá pra reaproveitar quase tudo do HistoricoVendas:
//
//   const [vendas, setVendas] = useState<Venda[]>([]);
//   useEffect(() => {
//     vendaService.getVendas({ clientId: client.id }).then(setVendas);
//   }, [client.id]);

export function ComprasTab({ client }: TabProps) {
	return (
		<div className="text-center text-muted py-4">
			Histórico de compras de {client.name} ainda não implementado.
		</div>
	);
}
