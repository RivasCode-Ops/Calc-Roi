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

HORIZONTE_PADRAO_MESES = 60


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
    horizonte_analise_meses: int = HORIZONTE_PADRAO_MESES


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
    horizonte_analise_meses: int
    vpl: float
    tir_mensal_percentual: float | None
    tir_anual_percentual: float | None
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


def _fator_anuidade(taxa_decimal: float, periodos: int) -> float:
    if periodos <= 0:
        return 0.0
    if abs(taxa_decimal) < 1e-12:
        return float(periodos)
    return (1 - (1 + taxa_decimal) ** -periodos) / taxa_decimal


def calcular_vpl(
    investimento: float,
    lucro_mensal: float,
    taxa_mensal_pct: float,
    horizonte_meses: int,
) -> float:
    if investimento <= 0 or horizonte_meses <= 0:
        return 0.0
    i = taxa_mensal_pct / 100
    if lucro_mensal <= 0:
        return -investimento
    return lucro_mensal * _fator_anuidade(i, horizonte_meses) - investimento


def calcular_tir_mensal(
    investimento: float,
    lucro_mensal: float,
    horizonte_meses: int,
) -> float | None:
    if investimento <= 0 or lucro_mensal <= 0 or horizonte_meses <= 0:
        return None

    def npv(taxa_decimal: float) -> float:
        if taxa_decimal <= -1:
            return float("inf")
        soma = -investimento
        base = 1 + taxa_decimal
        for t in range(1, horizonte_meses + 1):
            soma += lucro_mensal / (base**t)
        return soma

    lo, hi = -0.99, 10.0
    f_lo, f_hi = npv(lo), npv(hi)
    if f_lo * f_hi > 0:
        hi = 50.0
        f_hi = npv(hi)
        if f_lo * f_hi > 0:
            return None

    for _ in range(80):
        mid = (lo + hi) / 2
        f_mid = npv(mid)
        if abs(f_mid) < 1e-7 or hi - lo < 1e-9:
            return mid * 100
        if f_lo * f_mid <= 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return ((lo + hi) / 2) * 100


def tir_anual_efetiva(tir_mensal_pct: float | None) -> float | None:
    if tir_mensal_pct is None:
        return None
    r = tir_mensal_pct / 100
    return ((1 + r) ** 12 - 1) * 100


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

    horizonte = max(1, entrada.horizonte_analise_meses)
    vpl = calcular_vpl(inv, lucro, selic_mensal_pct, horizonte)
    tir_m = calcular_tir_mensal(inv, lucro, horizonte)
    tir_a = tir_anual_efetiva(tir_m)

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
        horizonte_analise_meses=horizonte,
        vpl=vpl,
        tir_mensal_percentual=tir_m,
        tir_anual_percentual=tir_a,
        rendimento_passivo_mensal=rf,
        rendimento_passivo_anual=rf_anual,
        diferencial_renda_fixa=diff,
        diferencial_renda_fixa_anual=lucro_anual - rf_anual,
        veredito=veredito,
        semaforo=semaforo,
    )


def calcular_todos_cenarios(entrada: EntradaRoi) -> dict[CenarioNome, ResultadoRoi]:
    return {c: calcular_cenario(entrada, c) for c in CENARIO_FATOR}
