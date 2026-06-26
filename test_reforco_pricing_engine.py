"""Testes — motor de precificação reforço escolar (espelha reforco-pricing-engine.js)."""

from __future__ import annotations

import pytest

# Simulação de mercado (branch simulacao-precos-reforco)
CONFIG = {
    "semanasPorMes": 4,
    "duracaoPadraoMinutos": 60,
    "segmentos": {
        "infantil_4_5": {"label": "Infantil 4-5 anos", "valorHoraBase": 45},
        "fundamental_1_5": {"label": "1º ao 5º ano", "valorHoraBase": 50},
        "fundamental_6_9": {"label": "6º ao 9º ano", "valorHoraBase": 60},
        "ensino_medio": {"label": "Ensino médio", "valorHoraBase": 70},
    },
    "modalidades": {
        "individual": {"label": "Individual", "fatorPorAluno": 1.0, "alunosReferencia": 1},
        "dupla": {"label": "Dupla", "fatorPorAluno": 0.70, "alunosReferencia": 2},
        "trio": {"label": "Trio", "fatorPorAluno": 0.60, "alunosReferencia": 3},
        "grupo": {"label": "Grupo", "fatorPorAluno": 0.50, "alunosReferencia": 6},
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
    assert r["valorPorAula"] == 50
    assert r["aulasPorMes"] == 4
    assert r["mensalidadePorAluno"] == 200
    assert r["descontoPct"] == 0


def test_dupla_fator_por_aluno():
    r = calcular_preco_reforco(
        {"segmentoId": "fundamental_1_5", "modalidadeId": "dupla", "aulasPorSemana": 1}
    )
    assert r["valorPorAula"] == pytest.approx(35)
    assert r["mensalidadePorAluno"] == pytest.approx(140)


def test_cenario_1_em_individual():
    r = calcular_preco_reforco(
        {
            "segmentoId": "ensino_medio",
            "modalidadeId": "individual",
            "aulasPorSemana": 2,
            "duracaoMinutos": 60,
        }
    )
    assert r["valorPorAula"] == 70
    assert r["aulasPorMes"] == 8
    assert r["descontoPct"] == 5
    assert r["mensalidadePorAluno"] == pytest.approx(532)


def test_cenario_2_fundamental_trio():
    r = calcular_preco_reforco(
        {
            "segmentoId": "fundamental_1_5",
            "modalidadeId": "trio",
            "aulasPorSemana": 3,
            "duracaoMinutos": 60,
        }
    )
    assert r["valorPorAula"] == pytest.approx(30)
    assert r["aulasPorMes"] == 12
    assert r["descontoPct"] == 10
    assert r["mensalidadePorAluno"] == pytest.approx(324)


def test_infantil_dupla_45min():
    r = calcular_preco_reforco(
        {
            "segmentoId": "infantil_4_5",
            "modalidadeId": "dupla",
            "aulasPorSemana": 1,
            "duracaoMinutos": 45,
        }
    )
    assert r["valorPorAula"] == pytest.approx(23.625)
    assert r["mensalidadePorAluno"] == pytest.approx(94.50)


def test_desconto_12_aulas():
    r = calcular_preco_reforco(
        {"segmentoId": "fundamental_1_5", "modalidadeId": "individual", "aulasPorSemana": 3}
    )
    assert r["aulasPorMes"] == 12
    assert r["descontoPct"] == 10
    assert r["mensalidadePorAluno"] == pytest.approx(540)
