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
import type { ClientInput, RegisterPayment, ClientsFilter } from './clients.types'


export const clientKeys = {
    all: ['clients'] as const,
    lists: () => [...clientKeys.all, 'list'] as const,
    list: (filter: ClientsFilter) => [...clientKeys.lists(), filter] as const,
    detail: (id: number) => [...clientKeys.all, 'detail', id] as const,
}



export const clientsQuery = (filter: ClientsFilter = {}) =>
    queryOptions({
        queryKey: clientKeys.list(filter),
        queryFn: async () => {
            const data = await getClients(filter)
            if (!data || !Array.isArray(data.items)) throw new Error('Resposta inválida da API')
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
        onSuccess: (id) => {
            qc.invalidateQueries({ queryKey: clientKeys.detail(id) })
            qc.invalidateQueries({ queryKey: clientKeys.lists() })
        },
    })
}

export function useUpdateClient() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: ClientInput }) => updateClient(id, data),
        onSuccess: (_id, { id }) => {
            qc.invalidateQueries({ queryKey: clientKeys.detail(id) })
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