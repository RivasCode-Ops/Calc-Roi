"""Testes — motor de precificação reforço escolar (espelha reforco-pricing-engine.js)."""

from __future__ import annotations

import pytest

CONFIG = {
    "semanasPorMes": 4,
    "duracaoPadraoMinutos": 60,
    "segmentos": {
        "fundamental_1_5": {"label": "1º ao 5º ano", "valorHoraBase": 40},
    },
    "modalidades": {
        "individual": {"label": "Individual", "fatorPorAluno": 1.0, "alunosReferencia": 1},
        "dupla": {"label": "Dupla", "fatorPorAluno": 0.65, "alunosReferencia": 2},
    },
    "descontosPorAulasNoMes": [
        {"minAulas": 0, "descontoPct": 0, "label": "Sem desconto"},
        {"minAulas": 8, "descontoPct": 5, "label": "5%"},
        {"minAulas": 12, "descontoPct": 10, "label": "10%"},
    ],
}


def _resolver_desconto(aulas_no_mes: int, config: dict) -> dict:
    faixas = sorted(config["descontosPorAulasNoMes"], key=lambda f: f["minAulas"], reverse=True)
    for faixa in faixas:
        if aulas_no_mes >= faixa["minAulas"]:
            return faixa
    return {"descontoPct": 0, "label": "Sem desconto"}


def calcular_preco_reforco(entrada: dict, config: dict = CONFIG) -> dict:
    segmento = config["segmentos"][entrada["segmentoId"]]
    modalidade = config["modalidades"][entrada["modalidadeId"]]
    semanas = config["semanasPorMes"]
    duracao = entrada.get("duracaoMinutos") or config["duracaoPadraoMinutos"]
    horas = duracao / 60

    valor_hora = segmento["valorHoraBase"] * modalidade["fatorPorAluno"]
    valor_aula = valor_hora * horas
    aulas_mes = entrada["aulasPorSemana"] * semanas
    subtotal = valor_aula * aulas_mes
    faixa = _resolver_desconto(aulas_mes, config)
    desconto_pct = faixa["descontoPct"]
    mensalidade = subtotal * (1 - desconto_pct / 100)

    return {
        "ok": True,
        "valorPorAula": valor_aula,
        "aulasPorMes": aulas_mes,
        "mensalidadePorAluno": mensalidade,
        "descontoPct": desconto_pct,
    }


def test_individual_sem_desconto():
    r = calcular_preco_reforco(
        {"segmentoId": "fundamental_1_5", "modalidadeId": "individual", "aulasPorSemana": 1}
    )
    assert r["valorPorAula"] == 40
    assert r["aulasPorMes"] == 4
    assert r["mensalidadePorAluno"] == 160
    assert r["descontoPct"] == 0


def test_dupla_fator_por_aluno():
    r = calcular_preco_reforco(
        {"segmentoId": "fundamental_1_5", "modalidadeId": "dupla", "aulasPorSemana": 1}
    )
    assert r["valorPorAula"] == pytest.approx(26)
    assert r["mensalidadePorAluno"] == pytest.approx(104)


def test_infantil_dupla_45min():
    r = calcular_preco_reforco(
        {
            "segmentoId": "infantil_4_5",
            "modalidadeId": "dupla",
            "aulasPorSemana": 1,
            "duracaoMinutos": 45,
        },
        config={
            **CONFIG,
            "segmentos": {
                "infantil_4_5": {"label": "Infantil", "valorHoraBase": 35},
            },
            "modalidades": {
                **CONFIG["modalidades"],
                "dupla": {"label": "Dupla", "fatorPorAluno": 0.65, "alunosReferencia": 2},
            },
        },
    )
    assert r["valorPorAula"] == pytest.approx(17.0625)
    assert r["mensalidadePorAluno"] == pytest.approx(68.25)


def test_desconto_12_aulas():
    r = calcular_preco_reforco(
        {"segmentoId": "fundamental_1_5", "modalidadeId": "individual", "aulasPorSemana": 3}
    )
    assert r["aulasPorMes"] == 12
    assert r["descontoPct"] == 10
    assert r["mensalidadePorAluno"] == pytest.approx(432)
