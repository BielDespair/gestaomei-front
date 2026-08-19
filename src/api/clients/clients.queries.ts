// clients.queries.ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getClients,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    registerPayment,
} from './clients.api'
import type { ClientInput, RegisterPayment } from './clients.types'


export const clientKeys = {
    all: ['clients'] as const,
    lists: () => [...clientKeys.all, 'list'] as const,
    detail: (id: number) => [...clientKeys.all, 'detail', id] as const,
}



export const clientsQuery = () =>
    queryOptions({
        queryKey: clientKeys.lists(),
        queryFn: async () => {
            const data = await getClients()
            if (!Array.isArray(data)) throw new Error('Resposta inválida da API')
            return data
        },
    })

export const clientQuery = (id: number) =>
    queryOptions({
        queryKey: clientKeys.detail(id),
        queryFn: () => getClient(id),
        enabled: Number.isFinite(id),
    })

export function useAddClient() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (data: ClientInput) => addClient(data),
        onSuccess: (created) => {
            qc.setQueryData(clientKeys.detail(created.id), created)
            qc.invalidateQueries({ queryKey: clientKeys.lists() })
        },
    })
}

export function useUpdateClient() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ClientInput }) => updateClient(id, data),
        onSuccess: (updated, { id }) => {
            qc.setQueryData(clientKeys.detail(id), updated)
            qc.invalidateQueries({ queryKey: clientKeys.lists() })
        },
    })
}

export function useDeleteClient() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => deleteClient(id),
        onSuccess: (_data, id) => {
            qc.removeQueries({ queryKey: clientKeys.detail(id) })
            qc.invalidateQueries({ queryKey: clientKeys.lists() })
        },
    })
}

export function useRegisterPayment() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: ({ clientId, payload }: { clientId: number; payload: RegisterPayment }) => registerPayment(clientId, payload),
        onSuccess: (_data, { clientId }) => {
            qc.invalidateQueries({ queryKey: clientKeys.detail(clientId) })
            qc.invalidateQueries({ queryKey: clientKeys.lists() })
        },
    })
}