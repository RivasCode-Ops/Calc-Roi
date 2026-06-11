"""Testes do motor escolar — espelha escola-engine.js."""

import math

import pytest


def calcular_escola(e):
    turmas = math.ceil(e["num_alunos"] / e["alunos_por_turma"])
    horas_total = e["num_alunos"] * e["aulas_semana"] * e["duracao_h"]
    professoras = max(1, math.ceil(horas_total / e["horas_prof"]))
    salas = max(1, math.ceil(turmas / e["turnos"]))
    fat = e["num_alunos"] * e["mensalidade"]
    custo_prof = professoras * e["salario_prof"]
    fixos = e.get("fixos", 0)
    custos = custo_prof + fixos
    lucro = fat - custos
    return {
        "turmas": turmas,
        "horas_total": horas_total,
        "professoras": professoras,
        "salas": salas,
        "lucro": lucro,
    }


def test_cenario_50_alunos_spec():
    e = {
        "num_alunos": 50,
        "mensalidade": 700,
        "alunos_por_turma": 8,
        "aulas_semana": 2,
        "duracao_h": 1.5,
        "horas_prof": 30,
        "turnos": 3,
        "salario_prof": 2500,
        "fixos": 2600,
    }
    r = calcular_escola(e)
    assert r["turmas"] == 7
    assert r["horas_total"] == 150
    assert r["professoras"] == 5
    assert r["salas"] == 3
    assert r["lucro"] == 50 * 700 - (5 * 2500 + 2600)


def test_20_alunos_duas_professoras():
    """Carga = alunos × aulas × duração → 20×3 = 60 h/sem → 2 professoras (30 h cada)."""
    e = {
        "num_alunos": 20,
        "mensalidade": 700,
        "alunos_por_turma": 8,
        "aulas_semana": 2,
        "duracao_h": 1.5,
        "horas_prof": 30,
        "turnos": 3,
        "salario_prof": 2500,
        "fixos": 2600,
    }
    r = calcular_escola(e)
    assert r["horas_total"] == 60
    assert r["professoras"] == 2
    assert r["salas"] == 1
