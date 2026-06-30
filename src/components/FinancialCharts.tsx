import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function RevenueLineChart({
  data,
}: {
  data: { date: string; gross: number; net: number }[]
}) {
  return (
    <ChartContainer
      config={{
        gross: { label: 'Receita Bruta', color: 'hsl(var(--chart-1))' },
        net: { label: 'Receita Líquida', color: 'hsl(var(--chart-2))' },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.split('-').reverse().join('/')}
          />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="gross"
            stroke="var(--color-gross)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function VerticalPerformancePie({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0)
    return <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
  return (
    <ChartContainer config={{ value: { label: 'Volume' } }} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function ProviderProfitabilityTable({
  data,
}: {
  data: { name: string; totalCommission: number; txCount: number }[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Provedor</TableHead>
          <TableHead className="text-right">Transações</TableHead>
          <TableHead className="text-right">Comissão VMX</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              Sem dados
            </TableCell>
          </TableRow>
        ) : (
          data.map((p, i) => (
            <TableRow key={i}>
              <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-right">{p.txCount}</TableCell>
              <TableCell className="text-right font-bold text-emerald-600">
                R$ {p.totalCommission.toFixed(2)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export function LogsTable({ logs }: { logs: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>ID Asaas</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Split</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              Sem logs
            </TableCell>
          </TableRow>
        ) : (
          logs.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-sm">
                {new Date(l.created).toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="font-mono text-xs">{l.asaas_id || '-'}</TableCell>
              <TableCell>R$ {(l.amount || 0).toFixed(2)}</TableCell>
              <TableCell className="text-amber-600">
                R$ {(l.split_amount || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={l.status === 'confirmed' ? 'default' : 'destructive'}>
                  {l.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
