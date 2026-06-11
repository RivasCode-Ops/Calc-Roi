"""Motor de cálculo — Raio-X de Negócios (V2)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

CenarioNome = Literal["pessimista", "base", "otimista"]

CENARIO_FATOR: dict[CenarioNome, float] = {
    "pessimista": 0.75,
    "base": 1.0,
    "otimista": 1.25,
}


@dataclass(frozen=True)
class EntradaRoi:
    investimento_total: float
    numero_clientes: int
    ticket_medio: float
    custos_mensais: float
    taxa_renda_fixa_anual: float
    prolabore_mensal: float = 0.0
    valor_equipamentos: float = 0.0
    vida_util_equipamentos_meses: int = 60


@dataclass(frozen=True)
class ResultadoRoi:
    cenario: CenarioNome
    faturamento_mensal: float
    depreciacao_mensal: float
    depreciacao_anual: float
    lucro_mensal: float
    lucro_anual: float
    roi_mensal_percentual: float
    roi_anual_percentual: float
    payback_meses: float | None
    rendimento_passivo_mensal: float
    rendimento_passivo_anual: float
    diferencial_renda_fixa: float
    diferencial_renda_fixa_anual: float
    veredito: str
    semaforo: Literal["verde", "amarelo", "vermelho"]


def _depreciacao_mensal(valor_equipamentos: float, vida_util_meses: int) -> float:
    if valor_equipamentos <= 0 or vida_util_meses <= 0:
        return 0.0
    return valor_equipamentos / vida_util_meses


def _veredito(lucro: float, roi: float, diff: float, selic_mensal_pct: float) -> tuple[str, str]:
    if lucro <= 0:
        return "Prejuízo", "vermelho"
    limiar_roi = selic_mensal_pct * 2
    if diff >= 0 and roi >= limiar_roi:
        return "Atrativo", "verde"
    if diff >= 0:
        return "Atenção", "amarelo"
    return "Melhor deixar aplicado", "vermelho"


def calcular_cenario(entrada: EntradaRoi, cenario: CenarioNome = "base") -> ResultadoRoi:
    fator = CENARIO_FATOR[cenario]
    clientes = max(0, int(round(entrada.numero_clientes * fator)))
    ticket = entrada.ticket_medio

    fat = clientes * ticket
    dep = _depreciacao_mensal(entrada.valor_equipamentos, entrada.vida_util_equipamentos_meses)
    lucro = fat - entrada.custos_mensais - entrada.prolabore_mensal - dep

    inv = entrada.investimento_total
    roi = (lucro / inv) * 100 if inv > 0 else 0.0
    payback = inv / lucro if lucro > 0 else None

    selic_mensal_pct = entrada.taxa_renda_fixa_anual / 12
    rf = inv * (selic_mensal_pct / 100) if inv > 0 else 0.0
    rf_anual = inv * (entrada.taxa_renda_fixa_anual / 100) if inv > 0 else 0.0
    diff = lucro - rf
    lucro_anual = lucro * 12
    roi_anual = (lucro_anual / inv) * 100 if inv > 0 else 0.0

    veredito, semaforo = _veredito(lucro, roi, diff, selic_mensal_pct)

    return ResultadoRoi(
        cenario=cenario,
        faturamento_mensal=fat,
        depreciacao_mensal=dep,
        depreciacao_anual=dep * 12,
        lucro_mensal=lucro,
        lucro_anual=lucro_anual,
        roi_mensal_percentual=roi,
        roi_anual_percentual=roi_anual,
        payback_meses=payback,
        rendimento_passivo_mensal=rf,
        rendimento_passivo_anual=rf_anual,
        diferencial_renda_fixa=diff,
        diferencial_renda_fixa_anual=lucro_anual - rf_anual,
        veredito=veredito,
        semaforo=semaforo,
    )


def calcular_todos_cenarios(entrada: EntradaRoi) -> dict[CenarioNome, ResultadoRoi]:
    return {c: calcular_cenario(entrada, c) for c in CENARIO_FATOR}
