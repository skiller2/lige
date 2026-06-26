import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";

const listaColumnasPersonal: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    name: "Persona",
    type: "number",
    id: "PersonalId",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "ApellidoNombre",
    name: "Persona",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalCUITCUILCUIT",
    name: "CUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "PersonalCUITCUILCUIT",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Sucursal Persona",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Grupo Actividad",
    type: "string",
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    fieldName: "ga.GrupoActividadDetalle",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Grupo Actividad",
    type: "number",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: "ga.GrupoActividadId",
    searchComponent: 'inputForGrupoActividadSearch',
    sortable: false,
    hidden: true,
    searchHidden: false
  },
  {
    id: "SituacionRevistaId",
    name: "Situacion Revista",
    field: "SituacionRevistaId",
    type: "number",
    fieldName: "sitrev.SituacionRevistaId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "SituacionRevistaDescripcion",
    name: "Situacion Revista",
    field: "SituacionRevistaDescripcion",
    fieldName: "sitrev.SituacionRevistaDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalSituacionRevistaDesde",
    name: "Situación Revista Desde",
    field: "PersonalSituacionRevistaDesde",
    fieldName: "persitrev.PersonalSituacionRevistaDesde",
    type: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "PersonalSituacionRevistaHasta",
    name: "Situación Revista Hasta",
    field: "PersonalSituacionRevistaHasta",
    fieldName: "persitrev.PersonalSituacionRevistaHasta",
    type: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    searchHidden: true,
    hidden: true,
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false,
    searchComponent: "inputForEfectoSearch",

  },
  {
    id: "EfectoDescripcionCompleto",
    name: "Efecto Descripción",
    field: "EfectoDescripcionCompleto",
    fieldName: "stk.EfectoDescripcionCompleto",
    type: "string",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,

  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "stk.StockReservado",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,

  },
  {
    id: "Importe",
    name: "Importe Unitario",
    field: "Importe",
    fieldName: "ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio)",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "RubroId",
    name: "Rubro",
    field: "RubroId",
    fieldName: "stk.RubroId",
    type: "number",
    searchComponent: "inputForRubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "RubroDescripcion",
    name: "Rubro",
    field: "RubroDescripcion",
    fieldName: "ru.RubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SubrubroId",
    name: "Subrubro",
    field: "SubrubroId",
    fieldName: "stk.SubrubroId",
    type: "number",
    searchComponent: "inputForSubrubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "SubrubroDescripcion",
    name: "Subrubro",
    field: "SubrubroDescripcion",
    fieldName: "sru.SubrubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

const listaColumnasObjetivos: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },

  {
    name: "Cliente",
    type: "string",
    id: "ClienteId",
    field: "ClienteId",
    fieldName: "obj.ClienteId",
    searchComponent: "inputForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Cliente",
    type: "string",
    id: "ClienteDenominacion",
    field: "ClienteDenominacion",
    fieldName: "cli.ClienteDenominacion",
    sortable: true,
    searchHidden: true,
    hidden: false,
    editable: false
  },
  {
    name: "Sucursal Objetivo",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 150,
  },
  {
    name: "Grupo Actividad",
    type: "string",
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    fieldName: " ga.GrupoActividadDetalle",
    sortable: true,
    searchHidden: true
  },
  {
    name: "Grupo Actividad",
    type: "string",
    id: "GrupoActividadId",
    field: "GrupoActividadId",
    fieldName: " ga.GrupoActividadId",
    searchComponent: "inputForGrupoActividadSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Objetivo",
    type: "number",
    id: "ObjetivoId",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    searchComponent: "inputForObjetivoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "ClienteElementoDependienteId",
    name: "ClienteElementoDependienteId",
    field: "ClienteElementoDependienteId",
    fieldName: "obj.ClienteElementoDependienteId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "ClienteElementoDependienteDescripcion",
    name: "Objetivo",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "ClienteElementoDependienteDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Contrato Desde",
    type: "date",
    id: "ClienteElementoDependienteContratoFechaDesde",
    field: "ClienteElementoDependienteContratoFechaDesde",
    fieldName: "eledepcon.ClienteElementoDependienteContratoFechaDesde",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Contrato Hasta",
    type: "date",
    id: "ClienteElementoDependienteContratoFechaHasta",
    field: "ClienteElementoDependienteContratoFechaHasta",
    fieldName: "ISNULL(eledepcon.ClienteElementoDependienteContratoFechaHasta, '9999-12-31')",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    name: "Objetivo Activo",
    id: "Activo",
    field: "Activo",
    fieldName: "ISNULL(eledepcon.Activo,'0')",
    type: 'string',
    searchComponent: "inputForActivo",

    sortable: true,

    formatter: 'collectionFormatter',
    params: { collection: getOptionsSINO },

    exportWithFormatter: true,
    hidden: false,
    searchHidden: false,
    minWidth: 70,
    maxWidth: 70,
    cssClass: 'text-center'
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false,
    searchComponent: "inputForEfectoSearch",
  },
  {
    id: "EfectoDescripcionCompleto",
    name: "Efecto Descripción",
    field: "EfectoDescripcionCompleto",
    fieldName: "stk.EfectoDescripcionCompleto",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "stk.StockReservado",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "Importe",
    name: "Importe Unitario",
    field: "Importe",
    fieldName: "ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio)",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "RubroId",
    name: "Rubro",
    field: "RubroId",
    fieldName: "stk.RubroId",
    type: "number",
    searchComponent: "inputForRubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "RubroDescripcion",
    name: "Rubro",
    field: "RubroDescripcion",
    fieldName: "ru.RubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SubrubroId",
    name: "Subrubro",
    field: "SubrubroId",
    fieldName: "stk.SubrubroId",
    type: "number",
    searchComponent: "inputForSubrubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "SubrubroDescripcion",
    name: "Subrubro",
    field: "SubrubroDescripcion",
    fieldName: "sru.SubrubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

const listaColumnasDeposito: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "DepositoId",
    name: "Depósito",
    field: "DepositoId",
    fieldName: "dep.DepositoId",
    type: "number",
    searchComponent: "inputForDepositoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "DepositoNombre",
    name: "Depósito",
    field: "DepositoNombre",
    fieldName: "dep.DepositoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false,
    searchComponent: "inputForEfectoSearch",
  },
  {
    id: "EfectoDescripcionCompleto",
    name: "Efecto Descripción",
    field: "EfectoDescripcionCompleto",
    fieldName: "stk.EfectoDescripcionCompleto",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "stk.StockReservado",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "Importe",
    name: "Importe Unitario",
    field: "Importe",
    fieldName: "ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio)",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "RubroId",
    name: "Rubro",
    field: "RubroId",
    fieldName: "stk.RubroId",
    type: "number",
    searchComponent: "inputForRubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "RubroDescripcion",
    name: "Rubro",
    field: "RubroDescripcion",
    fieldName: "ru.RubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SubrubroId",
    name: "Subrubro",
    field: "SubrubroId",
    fieldName: "stk.SubrubroId",
    type: "number",
    searchComponent: "inputForSubrubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "SubrubroDescripcion",
    name: "Subrubro",
    field: "SubrubroDescripcion",
    fieldName: "sru.SubrubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

const listaColumnasEfectoGeneral: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false,
    searchComponent: "inputForEfectoSearch",
  },
  {
    id: "EfectoDescripcionCompleto",
    name: "Efecto Descripción",
    field: "EfectoDescripcionCompleto",
    fieldName: "stk.EfectoDescripcionCompleto",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "PersonalId",
    name: "Persona",
    field: "PersonalId",
    fieldName: "per.PersonalId",
    type: "number",
    searchComponent: "inputForPersonalSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "ApellidoNombre",
    name: "Persona",
    field: "ApellidoNombre",
    fieldName: "ApellidoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Cliente",
    type: "number",
    id: "ClienteId",
    field: "ClienteId",
    fieldName: "obj.ClienteId",
    searchComponent: "inputForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    name: "Objetivo",
    type: "number",
    id: "ObjetivoId",
    field: "ObjetivoId",
    fieldName: "obj.ObjetivoId",
    searchComponent: "inputForObjetivoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    name: "Objetivo",
    type: "string",
    id: "ClienteElementoDependienteDescripcion",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "ClienteElementoDependienteDescripcion",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "ProveedorRazonSocial",
    name: "Proveedor",
    field: "ProveedorRazonSocial",
    fieldName: "pro.ProveedorRazonSocial",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "DepositoId",
    name: "Depósito",
    field: "DepositoId",
    fieldName: "dep.DepositoId",
    type: "number",
    searchComponent: "inputForDepositoSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "DepositoNombre",
    name: "Depósito",
    field: "DepositoNombre",
    fieldName: "dep.DepositoNombre",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "stk.StockReservado",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "RubroId",
    name: "Rubro",
    field: "RubroId",
    fieldName: "stk.RubroId",
    type: "number",
    searchComponent: "inputForRubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "RubroDescripcion",
    name: "Rubro",
    field: "RubroDescripcion",
    fieldName: "ru.RubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SubrubroId",
    name: "Subrubro",
    field: "SubrubroId",
    fieldName: "stk.SubrubroId",
    type: "number",
    searchComponent: "inputForSubrubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "SubrubroDescripcion",
    name: "Subrubro",
    field: "SubrubroDescripcion",
    fieldName: "sru.SubrubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "Importe",
    name: "Importe Unitario",
    field: "Importe",
    fieldName: "ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio)",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  }

]

const listaColumnasProveedores: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "ProveedorId",
    name: "Proveedor",
    field: "ProveedorId",
    fieldName: "stk.ProveedorId",
    type: "number",
    searchComponent: "inputForProveedorSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "ProveedorRazonSocial",
    name: "Proveedor",
    field: "ProveedorRazonSocial",
    fieldName: "pro.ProveedorRazonSocial",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    name: "Sucursal",
    type: "string",
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "EfectoId",
    name: "Efecto",
    field: "EfectoId",
    fieldName: "stk.EfectoId",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: false,
    searchComponent: "inputForEfectoSearch",
  },
  {
    id: "EfectoDescripcionCompleto",
    name: "Efecto Descripción",
    field: "EfectoDescripcionCompleto",
    fieldName: "stk.EfectoDescripcionCompleto",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "StockStock",
    name: "Stock",
    field: "StockStock",
    fieldName: "stk.StockStock",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "StockReservado",
    name: "Stock Reservado",
    field: "StockReservado",
    fieldName: "stk.StockReservado",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "Importe",
    name: "Importe Unitario",
    field: "Importe",
    fieldName: "ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio)",
    type: "currency",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 100,
  },
  {
    id: "RubroId",
    name: "Rubro",
    field: "RubroId",
    fieldName: "stk.RubroId",
    type: "number",
    searchComponent: "inputForRubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "RubroDescripcion",
    name: "Rubro",
    field: "RubroDescripcion",
    fieldName: "ru.RubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SubrubroId",
    name: "Subrubro",
    field: "SubrubroId",
    fieldName: "stk.SubrubroId",
    type: "number",
    searchComponent: "inputForSubrubroSearch",
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "SubrubroDescripcion",
    name: "Subrubro",
    field: "SubrubroDescripcion",
    fieldName: "sru.SubrubroDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
]

const listaColumnasMovimientos: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: true,
    hidden: true,
    searchHidden: true
  },
  {
    id: "MovimientoStockCodigo",
    name: "Código",
    field: "MovimientoStockCodigo",
    fieldName: "m.MovimientoStockCodigo",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: false,
    searchType: "numberAdvanced",
    searchComponent: "inputForNumberAdvancedSearch",
    maxWidth: 110,
  },
  {
    id: "Fecha",
    name: "Fecha",
    field: "Fecha",
    fieldName: "m.Fecha",
    type: "date",
    searchComponent: "inputForFechaSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "TipoDestino",
    name: "Destino",
    field: "TipoDestino",
    fieldName: "CASE WHEN m.DepositoIdDest IS NOT NULL THEN 'Depósito' WHEN m.PersonalIdDest IS NOT NULL THEN 'Persona' WHEN m.ProveedorIdDest IS NOT NULL THEN 'Proveedor' WHEN m.ClienteIdDest IS NOT NULL THEN 'Objetivo' ELSE '' END",
    type: "string",
    searchComponent: "inputForDestinoTipoSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
    maxWidth: 110,
  },
  {
    id: "DestinoDescripcion",
    name: "Persona / Objetivo / Proveedor / Depósito",
    field: "DestinoDescripcion",
    fieldName: "DestinoDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "SucursalDestino",
    name: "Sucursal Destino",
    field: "SucursalDestino",
    fieldName: "COALESCE(depd.DepositoSucursalId, psp.PersonalSucursalPrincipalSucursalId, prod.ProveedorSucursalId, eled.ClienteElementoDependienteSucursalId)",
    type: "string",
    searchComponent: "inputForSucursalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "Intermediario",
    name: "Intermediario",
    field: "Intermediario",
    fieldName: "m.IntermediarioPersonalId",
    type: "number",
    searchComponent: "inputForPersonalSearch",
    sortable: true,
    hidden: false,
    searchHidden: false,
  },
  {
    id: "TienePendiente",
    name: "Pendiente",
    field: "TienePendiente",
    fieldName: "m.TienePendiente",
    type: "string",
    searchComponent: "inputForActivo",
    sortable: true,
    hidden: false,
    searchHidden: false,
    formatter: 'collectionFormatter',
    params: { collection: [{ label: 'NO', value: '0' }, { label: 'SI', value: '1' }] },
    exportWithFormatter: true,
    minWidth: 80,
    maxWidth: 90,
    cssClass: 'text-center'
  },
  {
    id: "CantidadEfectos",
    name: "Cant. Efectos",
    field: "CantidadEfectos",
    fieldName: "CantidadEfectos",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true,
    maxWidth: 110,
    cssClass: 'text-center'
  },
  // Columnas solo de filtro (ocultas en la grilla). Apuntan al destino efectivo del derivado `m`:
  // si hay pendiente toma el destino real de MovimientoStockPendiente, si no el de MovimientoStock.
  {
    id: "PersonalId",
    name: "Persona",
    field: "PersonalId",
    fieldName: "m.PersonalIdDest",
    type: "number",
    searchComponent: "inputForPersonalSearch",
    sortable: false,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "ObjetivoId",
    name: "Objetivo",
    field: "ObjetivoId",
    fieldName: "(SELECT TOP 1 o.ObjetivoId FROM Objetivo o WHERE o.ClienteId = m.ClienteIdDest AND o.ClienteElementoDependienteId = m.ClienteElemDepDest)",
    type: "number",
    searchComponent: "inputForObjetivoSearch",
    sortable: false,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "ProveedorId",
    name: "Proveedor",
    field: "ProveedorId",
    fieldName: "m.ProveedorIdDest",
    type: "number",
    searchComponent: "inputForProveedorSearch",
    sortable: false,
    hidden: true,
    searchHidden: false,
  },
  {
    id: "DepositoId",
    name: "Depósito",
    field: "DepositoId",
    fieldName: "m.DepositoIdDest",
    type: "number",
    searchComponent: "inputForDepositoSearch",
    sortable: false,
    hidden: true,
    searchHidden: false,
  },
]

export class EfectoController extends BaseController {

  async searchEfecto(req: any, res: Response, next: NextFunction) {
    const { fieldName, value, soloConStock, soloConIndividual } = req.body;
    const queryRunner = await getConnection(res.locals.userName);

    let buscar = false;
    let query: string = `SELECT DISTINCT EfectoId,EfectoEfectoIndividualId,EfectoDescripcionCompleto as EfectoDescripcion  FROM stockreal WHERE`;
    switch (fieldName) {
      case "EfectoDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            //            query += `(ClienteDenominacion LIKE '%${element.trim()}%') AND `;
            query += `(EfectoDescripcionCompleto LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "EfectoId":
        if (value > 0) {
          query += ` EfectoId = '${value}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    // Param 1 (opcional): solo efectos con stock disponible. Lo manda únicamente "Efecto:" del Origen.
    if (soloConStock) query += ` StockStock > 0 AND `;
    // Param 2 (opcional): solo efectos individuales (con EfectoEfectoIndividualId). Lo manda "Relacionado con".
    if (soloConIndividual) query += ` EfectoEfectoIndividualId IS NOT NULL AND `;

    queryRunner
      .query((query += " 1=1"))
      .then(async (records) => {
      await queryRunner.release()
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }

  // TODO: READAPTAR PARA QUE SE BUSQUE POR EFECTOID + EFECTOEFFECTOINDIVIDUALID (VER API Y FRONT TAMBIEN)
  async searchEfectoIndividual(req: any, res: Response, next: NextFunction) {
    const { fieldName, value } = req.body;
    const queryRunner = await getConnection(res.locals.userName);

    let buscar = false;
    let query: string = `SELECT EfectoId,EfectoEfectoIndividualId, EfectoEfectoIndividualDescripcion  FROM EfectoIndividualDescripcion WHERE`;
    switch (fieldName) {
      case "EfectoEfectoIndividualDescripcion":
        const valueArray: Array<string> = value.split(/[\s,.]+/);
        valueArray.forEach((element, index) => {
          if (element.trim().length > 1) {
            query += `(EfectoEfectoIndividualDescripcion LIKE '%${element.trim()}%') AND `;
            buscar = true;
          }
        });
        break;
      case "EfectoEfectoIndividualId":
        if (value.length > 0) {
          query += `EfectoEfectoIndividualId = '${value.EfectoEfectoIndividualId}' AND `;
          buscar = true;
        }
        break;
      default:
        break;
    }

    if (buscar == false) {
      this.jsonRes({ recordsArray: [] }, res);
      return;
    }

    queryRunner
      .query((query += " 1=1"))
      .then((records) => {
        this.jsonRes({ recordsArray: records }, res);
      })
      .catch((error) => {
        return next(error)
      });
  }


  async getEfectoRelaciones(req: any, res: Response, next: NextFunction) {
    const efectoId = Number(req.params.id);
    const individualIdRaw = req.query?.individualId;
    const individualId =  individualIdRaw === undefined || individualIdRaw === '' || individualIdRaw === 'null'
        ? null
        : Number(individualIdRaw);
    if (!efectoId) {
      this.jsonRes([], res);
      return;
    }
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await queryRunner.query(`
        SELECT
          ere.EfectoRelacionEfectoId,
          ere.EfectoRelacionConEfectoId,
          ere.EfectoRelacionConEfectoEfectoIndividualId,
          stDe.EfectoDescripcionCompleto  AS DescripcionDe,
          CASE
            WHEN ere.EfectoRelacionDeEfectoId = @0
                 AND (ere.EfectoRelacionDeEfectoEfectoIndividualId = @1
                      OR (@1 IS NULL AND ere.EfectoRelacionDeEfectoEfectoIndividualId IS NULL))
            THEN stCon.EfectoDescripcionCompleto
            ELSE stDe.EfectoDescripcionCompleto
          END AS DescripcionCon
        FROM EfectoRelacionEfecto AS ere
        INNER JOIN StockReal AS stDe
          ON stDe.EfectoId = ere.EfectoRelacionDeEfectoId
         AND (stDe.EfectoEfectoIndividualId = ere.EfectoRelacionDeEfectoEfectoIndividualId
              OR (stDe.EfectoEfectoIndividualId IS NULL AND ere.EfectoRelacionDeEfectoEfectoIndividualId IS NULL))
        INNER JOIN StockReal AS stCon
          ON stCon.EfectoId = ere.EfectoRelacionConEfectoId
         AND (stCon.EfectoEfectoIndividualId = ere.EfectoRelacionConEfectoEfectoIndividualId
              OR (stCon.EfectoEfectoIndividualId IS NULL AND ere.EfectoRelacionConEfectoEfectoIndividualId IS NULL))
        WHERE
          (ere.EfectoRelacionDeEfectoId = @0
           AND (ere.EfectoRelacionDeEfectoEfectoIndividualId = @1
                OR (@1 IS NULL AND ere.EfectoRelacionDeEfectoEfectoIndividualId IS NULL)))
          OR
          (ere.EfectoRelacionConEfectoId = @0
           AND (ere.EfectoRelacionConEfectoEfectoIndividualId = @1
                OR (@1 IS NULL AND ere.EfectoRelacionConEfectoEfectoIndividualId IS NULL)))
      `, [efectoId, individualId]);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getEfectoUbicaciones(req: any, res: Response, next: NextFunction) {
    const efectoId = Number(req.params.id);
    const individualIdRaw = req.query.individualId;
    const individualId = individualIdRaw === undefined || individualIdRaw === '' || individualIdRaw === 'null'
      ? null
      : Number(individualIdRaw);
    if (!efectoId) {
      this.jsonRes([], res);
      return;
    }
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await queryRunner.query(`
        SELECT
          stk.StockId,
          CASE
            WHEN stk.PersonalId IS NOT NULL THEN 'personal'
            WHEN stk.ObjetivoId IS NOT NULL THEN 'objetivo'
            WHEN stk.ProveedorId IS NOT NULL THEN 'proveedor'
            WHEN stk.DepositoId IS NOT NULL THEN 'deposito'
          END AS Tipo,
          stk.PersonalId,
          stk.ObjetivoId,
          stk.ProveedorId,
          stk.DepositoId,
          IIF(per.PersonalId IS NULL, NULL, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre))) AS PersonalApellidoNombre,
          IIF(ele.ClienteElementoDependienteId IS NULL, NULL, CONCAT(cli.ClienteId, '/', ele.ClienteElementoDependienteId, ' ', ele.ClienteElementoDependienteDescripcion)) AS ObjetivoDescripcion,
          pro.ProveedorRazonSocial,
          dep.DepositoNombre,
          dep.DepositoSucursalId,
          TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
          stk.StockStock
        FROM StockReal stk
        LEFT JOIN Personal per ON per.PersonalId = stk.PersonalId
        LEFT JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
        LEFT JOIN ClienteElementoDependiente ele ON ele.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND ele.ClienteId = obj.ClienteId
        LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN Proveedor pro ON pro.ProveedorId = stk.ProveedorId
        LEFT JOIN Deposito dep ON dep.DepositoId = stk.DepositoId
        LEFT JOIN Sucursal suc ON suc.SucursalId = dep.DepositoSucursalId
        WHERE stk.EfectoId = @0
          AND ((@1 IS NULL AND stk.EfectoEfectoIndividualId IS NULL) OR stk.EfectoEfectoIndividualId = @1)
          AND (stk.PersonalId IS NOT NULL OR stk.ObjetivoId IS NOT NULL OR stk.ProveedorId IS NOT NULL OR stk.DepositoId IS NOT NULL)
      `, [efectoId, individualId]);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async getGridColsPersonal(req, res) {
    this.jsonRes(listaColumnasPersonal, res);
  }

  async getGridColsObjetivos(req, res) {
    this.jsonRes(listaColumnasObjetivos, res);
  }

  async getGridColsDeposito(req, res) {
    this.jsonRes(listaColumnasDeposito, res);
  }

  async getGridColsProveedores(req, res) {
    this.jsonRes(listaColumnasProveedores, res);
  }

  async getGridColsEfectoGeneral(req, res) {
    this.jsonRes(listaColumnasEfectoGeneral, res);
  }

  async getGridColsMovimientos(req, res) {
    this.jsonRes(listaColumnasMovimientos, res);
  }

  private async efectobyPersonalIdQuery(queryRunner: any, personalId: number) {
    console.log('estoy...........................')
    const listOptions = {
      filtros: [
        {
          index: 'PersonalId',
          condition: 'AND',
          operador: '=',
          valor: [personalId],
          type: 'number',
        },
      ],
      sort: null,
    };

    return this.getEfectoQuery(queryRunner, listOptions);
  }

  private getEfectoQuery(queryRunner: any, listOptions: any) {
    const now = new Date();
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasPersonal)
    return queryRunner.query(`
     SELECT ROW_NUMBER() OVER (ORDER BY stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockId) AS id,
	    CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre,per.PersonalId,
	    cuit.PersonalCUITCUILCUIT , sitrev.SituacionRevistaId, sitrev.SituacionRevistaDescripcion, persitrev.PersonalSituacionRevistaDesde,persitrev.PersonalSituacionRevistaHasta,
		  stk.StockId, per.PersonalId, stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
		  stk.EfectoDescripcion, stk.EfectoAtrDescripcion, stk.EfectoEfectoIndividualDescripcion, stk.EfectoIndividualAtrDescripcion,
	    stk.EfectoDescripcionCompleto,
      ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,

      stk.RubroId,
      ru.RubroDescripcion,
      stk.SubrubroId,
      sru.SubrubroDescripcion,

	    ga.GrupoActividadDetalle,gaper.GrupoActividadPersonalDesde, gaper.GrupoActividadPersonalHasta,
	    suc.SucursalId , TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
      1
    FROM StockReal stk
      JOIN Personal per ON per.PersonalId = stk.PersonalId
      LEFT join PersonalSituacionRevista persitrev on persitrev.PersonalId=per.PersonalId and persitrev.PersonalSituacionRevistaDesde<=@0 AND ISNULL(persitrev.PersonalSituacionRevistaHasta,'9999-12-31')>=@0
      left JOIN SituacionRevista sitrev on sitrev.SituacionRevistaId=persitrev.PersonalSituacionRevistaSituacionId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)

	    LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
	    LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId

	    LEFT JOIN GrupoActividadPersonal gaper on gaper.GrupoActividadPersonalPersonalId=per.PersonalId and (select max(GrupoActividadPersonalId) from GrupoActividadPersonal where GrupoActividadPersonalPersonalId=per.PersonalId) = gaper.GrupoActividadPersonalId
	    LEFT JOIN GrupoActividad ga on ga.GrupoActividadId = gaper.GrupoActividadId
      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL and lp.ListaPrecioDesde<= @0 and ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi on lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0
      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId
    WHERE stk.StockStock > 0
        AND ${filterSql} `, [now])
  }

  async getEfectoPersonal(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.id
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  // usada para detalle asistencia, apartado de efectos por personal
  async getEfectoByPersonalId(req: any, res: Response, next: NextFunction) {
    const personalId = req.params.id
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.efectobyPersonalIdQuery(queryRunner, personalId);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  // usada para detalle asistencia, apartado de efectos por objetivo
  async getEfectoByObjetivoId(req: any, res: Response, next: NextFunction) {
    const objetivoId = req.params.id
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.efectobyObjetivoIdQuery(queryRunner, objetivoId);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private async efectobyObjetivoIdQuery(queryRunner: any, objetivoId: number) {
    const now = new Date();
    const listOptions = {
      filtros: [
        {
          index: 'ObjetivoId',
          condition: 'AND',
          operador: '=',
          valor: [objetivoId],
          type: 'number',
        },
      ],
      sort: null,
    };

    return this.getEfectoObjetivosQuery(queryRunner, listOptions);

  }


  // usada para la grilla de efectos por objetivos
  async getEfectoObjetivos(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoObjetivosQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private getEfectoObjetivosQuery(queryRunner: any, listOptions: any) {

    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasObjetivos)
    const now = new Date();
    return queryRunner.query(`

      SELECT ROW_NUMBER() OVER (ORDER BY stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockId) as id,
          stk.StockId,
          obj.ClienteId,
          cli.ClienteDenominacion, obj.ClienteElementoDependienteId,
          CONCAT(cli.ClienteId,'/', ISNULL(ele.ClienteElementoDependienteId,0), ' ',ele.ClienteElementoDependienteDescripcion) as ClienteElementoDependienteDescripcion, obj.ObjetivoId,
          stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
          stk.EfectoDescripcion, stk.EfectoAtrDescripcion, stk.EfectoEfectoIndividualDescripcion, stk.EfectoIndividualAtrDescripcion, eledepcon.ClienteElementoDependienteContratoId,eledepcon.ClienteElementoDependienteContratoFechaDesde,eledepcon.ClienteElementoDependienteContratoFechaHasta,
          stk.EfectoDescripcionCompleto,
          suc.SucursalDescripcion,
          ga.GrupoActividadDetalle, ga.GrupoActividadId,
          ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,
           ISNULL(eledepcon.Activo,0) AS Activo,

          stk.RubroId,
          ru.RubroDescripcion,
          stk.SubrubroId,
          sru.SubrubroDescripcion,

        1
    FROM StockReal stk
    JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
    LEFT JOIN ClienteElementoDependiente ele on ele.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and ele.ClienteId=obj.ClienteId
    LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN (
                            SELECT 
                                ec.ClienteId, 
                                ec.ClienteElementoDependienteId, 
                                ec.ClienteElementoDependienteContratoId, 
                                ec.ClienteElementoDependienteContratoFechaDesde, 
                                ec.ClienteElementoDependienteContratoFechaHasta,
                                                                CASE
                                                                       WHEN ec.ClienteElementoDependienteContratoFechaDesde<=@0 AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>=@0 THEN '1'
                                                                       ELSE '0' END AS Activo,
                                ROW_NUMBER() OVER (PARTITION BY ec.ClienteId, ec.ClienteElementoDependienteId 
                                                    ORDER BY ec.ClienteElementoDependienteContratoFechaDesde DESC) AS RowNum
                            FROM ClienteElementoDependienteContrato ec
                            WHERE EOMONTH(@0) >= ec.ClienteElementoDependienteContratoFechaDesde
                        ) eledepcon ON eledepcon.ClienteId = obj.ClienteId 
                            AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                            AND eledepcon.RowNum = 1       
                                    
    --LEFT JOIN ClienteElementoDependienteContrato con on con.ClienteId=obj.ClienteId and con.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and con.ClienteElementoDependienteContratoFechaDesde<=@0 AND ISNULL(con.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>@0
    LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ele.ClienteElementoDependienteSucursalId ,cli.ClienteSucursalId)

    LEFT JOIN GrupoActividadObjetivo gap ON gap.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND (SELECT MAX(GrupoActividadObjetivoId) FROM GrupoActividadObjetivo where GrupoActividadObjetivoObjetivoId=obj.ObjetivoId) = gap.GrupoActividadObjetivoId
    LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId
    LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL   and lp.ListaPrecioDesde<= @0 and ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
    LEFT JOIN ListaPrecioIndividual lpi on lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0
    LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
    LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId


    WHERE stk.StockStock > 0


      AND ${filterSql} `, [now])
  }

  async getEfectoDeposito(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoDepositoQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private getEfectoDepositoQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasDeposito)
    const now = new Date();
    return queryRunner.query(`
      SELECT ROW_NUMBER() OVER (ORDER BY stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockId) as id,
          stk.StockId,
          stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
          stk.EfectoDescripcion, stk.EfectoAtrDescripcion, stk.EfectoEfectoIndividualDescripcion, stk.EfectoIndividualAtrDescripcion,
          stk.EfectoDescripcionCompleto,
          dep.DepositoNombre,
          suc.SucursalDescripcion,
          ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,

          stk.RubroId,
          ru.RubroDescripcion,
          stk.SubrubroId,
          sru.SubrubroDescripcion,

          1
      FROM StockReal stk
      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL AND lp.ListaPrecioDesde <= @0 AND ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi ON lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0
      JOIN Deposito dep ON dep.DepositoId = stk.DepositoId
      LEFT JOIN Sucursal suc ON suc.SucursalId = dep.DepositoSucursalId
      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId
      WHERE ${filterSql} `, [now])
  }

  async getEfectoProveedores(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoProveedoresQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async getEfectoGeneral(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoGeneralQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  private getEfectoGeneralQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasEfectoGeneral)
    const now = new Date();
    return queryRunner.query(`
      SELECT ROW_NUMBER() OVER (ORDER BY stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockId) as id,
          stk.EfectoId, stk.EfectoEfectoIndividualId, stk.EfectoDescripcion, stk.EfectoAtrDescripcion, stk.EfectoEfectoIndividualDescripcion, stk.EfectoIndividualAtrDescripcion,
          stk.EfectoDescripcionCompleto,
          stk.StockId,
          stk.StockStock, stk.StockReservado,

          stk.RubroId,
          ru.RubroDescripcion,
          stk.SubrubroId,
          sru.SubrubroDescripcion,

          pro.ProveedorId, pro.ProveedorRazonSocial, sucpro.SucursalDescripcion AS ProveedorSucursalDescripcion,
          dep.DepositoId, dep.DepositoNombre, sucdep.SucursalDescripcion AS DepositoSucursalDescripcion,
          per.PersonalId, cuit.PersonalCUITCUILCUIT, IIF(per.PersonalId IS NULL,NULL,CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre))) ApellidoNombre,
          obj.ObjetivoId, cli.ClienteId, ele.ClienteElementoDependienteId, IIF(ele.ClienteElementoDependienteId IS NULL,NULL,CONCAT(cli.ClienteId,'/', ele.ClienteElementoDependienteId, ' ',ele.ClienteElementoDependienteDescripcion)) as ClienteElementoDependienteDescripcion,

          ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,

          1
      FROM StockReal stk

      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId

      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL and lp.ListaPrecioDesde<= @0 and ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi on lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0

      LEFT JOIN Proveedor pro ON pro.ProveedorId = stk.ProveedorId
      LEFT JOIN Sucursal sucpro ON sucpro.SucursalId = pro.ProveedorSucursalId

      LEFT JOIN Deposito dep ON dep.DepositoId = stk.DepositoId
      LEFT JOIN Sucursal sucdep ON sucdep.SucursalId = dep.DepositoSucursalId

      LEFT JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
      LEFT JOIN ClienteElementoDependiente ele on ele.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and ele.ClienteId=obj.ClienteId
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN Sucursal sucobj ON sucobj.SucursalId = ele.ClienteElementoDependienteSucursalId

      LEFT JOIN Personal per ON per.PersonalId = stk.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      LEFT JOIN PersonalSucursalPrincipal sucrper ON sucrper.PersonalId = per.PersonalId AND sucrper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
      LEFT JOIN Sucursal sucper ON sucper.SucursalId=sucrper.PersonalSucursalPrincipalSucursalId
      WHERE ${filterSql} `, [now])
  }

  private getEfectoProveedoresQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasProveedores)
    const now = new Date();
    return queryRunner.query(`
      SELECT ROW_NUMBER() OVER (ORDER BY stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockId) as id,
          stk.StockId,
          stk.EfectoId, stk.EfectoEfectoIndividualId, stk.StockStock, stk.StockReservado,
          stk.EfectoDescripcion, stk.EfectoAtrDescripcion, stk.EfectoEfectoIndividualDescripcion, stk.EfectoIndividualAtrDescripcion,
          stk.EfectoDescripcionCompleto,
          pro.ProveedorRazonSocial,
          suc.SucursalDescripcion,
          ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,

          stk.RubroId,
          ru.RubroDescripcion,
          stk.SubrubroId,
          sru.SubrubroDescripcion,

          1
      FROM StockReal stk
      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL AND lp.ListaPrecioDesde <= @0 AND ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi ON lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0
      JOIN Proveedor pro ON pro.ProveedorId = stk.ProveedorId
      LEFT JOIN Sucursal suc ON suc.SucursalId = pro.ProveedorSucursalId
      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId
      WHERE ${filterSql} `, [now])
  }

  // Listado de todos los movimientos de stock. Cuando un movimiento tiene registro en
  // MovimientoStockPendiente significa que se cargó con intermediario: en ese caso el destino real
  // (persona/objetivo/proveedor/depósito) está en la tabla Pendiente y el PersonalIdDestino de
  // MovimientoStock es en realidad el intermediario.
  async getEfectoMovimientos(req: any, res: Response, next: NextFunction) {
    const listOptions = req.body.listOptions
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.getEfectoMovimientosQuery(queryRunner, listOptions);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private getEfectoMovimientosQuery(queryRunner: any, listOptions: any) {
    const filterSql = filtrosToSql(listOptions.filtros, listaColumnasMovimientos)
    return queryRunner.query(`
      SELECT ROW_NUMBER() OVER (ORDER BY m.MovimientoStockCodigo DESC) AS id,
          m.MovimientoStockCodigo,
          m.Fecha,
          CASE
            WHEN m.DepositoIdDest IS NOT NULL THEN 'Depósito'
            WHEN m.PersonalIdDest IS NOT NULL THEN 'Persona'
            WHEN m.ProveedorIdDest IS NOT NULL THEN 'Proveedor'
            WHEN m.ClienteIdDest IS NOT NULL THEN 'Objetivo'
            ELSE ''
          END AS TipoDestino,
          COALESCE(
            TRIM(depd.DepositoNombre),
            IIF(m.PersonalIdDest IS NULL, NULL, CONCAT(TRIM(perd.PersonalApellido), ', ', TRIM(perd.PersonalNombre))),
            TRIM(prod.ProveedorRazonSocial),
            IIF(m.ClienteIdDest IS NULL, NULL,
              CONCAT(m.ClienteIdDest, IIF(m.ClienteElemDepDest IS NULL, '', CONCAT('/', m.ClienteElemDepDest)),
                IIF(eled.ClienteElementoDependienteDescripcion IS NULL, '', CONCAT(' ', TRIM(eled.ClienteElementoDependienteDescripcion)))))
          ) AS DestinoDescripcion,
          TRIM(COALESCE(sucdep.SucursalDescripcion, sucper.SucursalDescripcion, sucpro.SucursalDescripcion, sucobj.SucursalDescripcion)) AS SucursalDestino,
          IIF(m.IntermediarioPersonalId IS NULL, NULL, CONCAT(TRIM(peri.PersonalApellido), ', ', TRIM(peri.PersonalNombre))) AS Intermediario,
          m.TienePendiente,
          m.CantidadEfectos
      FROM (
        SELECT mov.MovimientoStockCodigo, mov.Fecha,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, pend.PersonalIdDestino, mov.PersonalIdDestino) AS PersonalIdDest,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, pend.ProveedorIdDestino, mov.ProveedorIdDestino) AS ProveedorIdDest,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, pend.ClienteIdDestino, mov.ClienteIdDestino) AS ClienteIdDest,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, pend.ClienteElementoDependienteIdDestino, mov.ClienteElementoDependienteIdDestino) AS ClienteElemDepDest,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, pend.DepositoIdDestino, mov.DepositoIdDestino) AS DepositoIdDest,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, mov.PersonalIdDestino, NULL) AS IntermediarioPersonalId,
            IIF(pend.MovimientoStockCodigo IS NOT NULL, '1', '0') AS TienePendiente,
            ISNULL((SELECT SUM(det.Cantidad) FROM MovimientoStockDetalle det WHERE det.MovimientoStockCodigo = mov.MovimientoStockCodigo), 0) AS CantidadEfectos
        FROM MovimientoStock mov
        LEFT JOIN MovimientoStockPendiente pend ON pend.MovimientoStockCodigo = mov.MovimientoStockCodigo
      ) m
      LEFT JOIN Deposito depd ON depd.DepositoId = m.DepositoIdDest
      LEFT JOIN Sucursal sucdep ON sucdep.SucursalId = depd.DepositoSucursalId
      LEFT JOIN Personal perd ON perd.PersonalId = m.PersonalIdDest
      LEFT JOIN PersonalSucursalPrincipal psp ON psp.PersonalId = perd.PersonalId AND psp.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) FROM PersonalSucursalPrincipal a WHERE a.PersonalId = perd.PersonalId)
      LEFT JOIN Sucursal sucper ON sucper.SucursalId = psp.PersonalSucursalPrincipalSucursalId
      LEFT JOIN Proveedor prod ON prod.ProveedorId = m.ProveedorIdDest
      LEFT JOIN Sucursal sucpro ON sucpro.SucursalId = prod.ProveedorSucursalId
      LEFT JOIN ClienteElementoDependiente eled ON eled.ClienteId = m.ClienteIdDest AND eled.ClienteElementoDependienteId = m.ClienteElemDepDest
      LEFT JOIN Sucursal sucobj ON sucobj.SucursalId = eled.ClienteElementoDependienteSucursalId
      LEFT JOIN Personal peri ON peri.PersonalId = m.IntermediarioPersonalId
      WHERE ${filterSql} `)
  }

}