import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Selections } from "../schemas/filtro.ts";
import { logger } from "../logger/logger.ts";

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
    type: "number",
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
  // {
  //   id: "EfectoStockMinimo",
  //   name: "Stock Mínimo",
  //   field: "EfectoStockMinimo",
  //   fieldName: "efe.EfectoStockMinimo",
  //   type: "number",
  //   sortable: true,
  //   hidden: false,
  //   searchHidden: false,
  //   searchType: "columnComparison",
  //   searchComponent: "inputForColumnComparisonSearch",
  //   compareFieldName: "stk.StockStock",
  //   compareFieldLabel: "Stock",
  //   maxWidth: 100,
  // },
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
    id: "SucursalDescripcion",
    name: "Sucursal",
    field: "SucursalDescripcion",
    fieldName: "COALESCE(sucpro.SucursalId, sucdep.SucursalId, sucobj.SucursalId, sucper.SucursalId)",
    searchComponent: "inputForSucursalSearch",
    sortable: false,
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

export class EfectoController extends BaseController {

  async searchEfecto(req: any, res: Response, next: NextFunction) {
    const { fieldName, value, soloConStock, soloConIndividual, soloConEfecto } = req.body;
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

    if (soloConEfecto) query += ` EfectoEfectoIndividualId IS NULL AND `;


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

  async getEfectoRelaciones(req: any, res: Response, next: NextFunction) {
    const efectoId = Number(req.params.id);
    const individualIdRaw = req.query?.individualId;
    const individualId = individualIdRaw === undefined || individualIdRaw === '' || individualIdRaw === 'null'
      ? null
      : Number(individualIdRaw);
    if (!efectoId) {
      this.jsonRes([], res);
      return;
    }
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await this.relacionesDe(queryRunner, efectoId, individualId);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // La comparte el GET de relaciones (lo usa efecto-stock-linea) y el GET del form de modificación.
  private async relacionesDe(queryRunner: any, efectoId: number, individualId: number | null) {
    return await queryRunner.query(`
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
  }

  async getEfectoUbicaciones(req: any, res: Response, next: NextFunction) {
    const efectoId = Number(req.params.id);
    const individualIdRaw = req.query.individualId;
    const individualId = individualIdRaw === undefined || individualIdRaw === '' || individualIdRaw === 'null'
      ? null
      : Number(individualIdRaw);
    const ingresoStock = req.query.ingresoStock === 'true' || req.query.ingresoStock === '1';
    if (!efectoId) {
      this.jsonRes([], res);
      return;
    }
    const queryRunner = await getConnection(res.locals.userName);
    try {

      if (ingresoStock) {
        const proveedores = await queryRunner.query(`
          SELECT
            COALESCE(stk.StockId, -pro.ProveedorId) AS StockId,
            'proveedor' AS Tipo,
            NULL AS PersonalId,
            NULL AS ObjetivoId,
            pro.ProveedorId,
            NULL AS DepositoId,
            NULL AS PersonalApellidoNombre,
            NULL AS ObjetivoDescripcion,
            TRIM(pro.ProveedorRazonSocial) AS ProveedorRazonSocial,
            NULL AS DepositoNombre,
            NULL AS DepositoSucursalId,
            TRIM(suc.SucursalDescripcion) AS SucursalDescripcion,
            stk.StockStock
          FROM Proveedor pro
          LEFT JOIN Sucursal suc ON suc.SucursalId = pro.ProveedorSucursalId
          LEFT JOIN StockReal stk ON stk.ProveedorId = pro.ProveedorId AND stk.EfectoId = @0
            AND ((@1 IS NULL AND stk.EfectoEfectoIndividualId IS NULL) OR stk.EfectoEfectoIndividualId = @1)
          ORDER BY pro.ProveedorRazonSocial
        `, [efectoId, individualId]);
        this.jsonRes(proveedores, res);
        return;
      }

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

  async getGridFilters(req: any, res: Response, next: NextFunction) {
    const startFilters: Selections[] = []
    const sucursalIds = Array.isArray(res.locals.filterSucursal) ? res.locals.filterSucursal : [];
    const grupoActividadIds = Array.isArray(res.locals.GrupoActividad) ? res.locals.GrupoActividad.map((grupo: any) => Number(grupo.GrupoActividadId)).filter((id: number) => id > 0) : [];
    const filterSucursal = sucursalIds.join(';');
    const grupoActividad = grupoActividadIds.join(';');

    const authADGroup = Boolean(res.locals?.authADGroup);

    if (!filterSucursal) throw new ClientException('No se ha especificado la sucursal del usuario')

    if (grupoActividadIds.length > 0) {
      startFilters.push({
        index: 'GrupoActividadId',
        condition: 'AND',
        operator: '=',
        value: grupoActividad,
        closeable: authADGroup, // solo se puede eliminar filtro de grupoActividad si tiene authADGroup
        label: '',
        originIdx: null
      })
    }

    startFilters.unshift({
      index: 'SucursalDescripcion',
      condition: 'AND',
      operator: '=',
      value: filterSucursal,
      closeable: (authADGroup && sucursalIds.includes(1)) ? true : false, // solo se puede eliminar filtro de sucursal si tiene authADGroup y la sucursal 1 (central)
      label: '',
      originIdx: null
    })

    return this.jsonRes(startFilters, res)
  }

  private async efectobyPersonalIdQuery(queryRunner: any, personalId: number) {
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
      efe.EfectoStockMinimo,

	    ga.GrupoActividadDetalle, ga.GrupoActividadNumero, ga.GrupoActividadId, gaper.GrupoActividadPersonalDesde, gaper.GrupoActividadPersonalHasta,
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
      -- StockReal no expone las columnas propias de Efecto: EfectoStockMinimo viaja en la fila para
      -- que el form de modificación lo edite sin pisarlo con NULL al guardar.
      LEFT JOIN Efecto efe ON efe.EfectoId = stk.EfectoId
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
    } finally {
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
    } finally {
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
    } finally {
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
    } finally {
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
          efe.EfectoStockMinimo,

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
    LEFT JOIN Efecto efe ON efe.EfectoId = stk.EfectoId


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
    } finally {
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
          efe.EfectoStockMinimo,

          1
      FROM StockReal stk
      left join Efecto efe on efe.EfectoId = stk.EfectoId and stk.EfectoEfectoIndividualId is null
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
    } finally {
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
    } finally {
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
          efe.EfectoStockMinimo,

          pro.ProveedorId, pro.ProveedorRazonSocial, sucpro.SucursalDescripcion AS ProveedorSucursalDescripcion,
          dep.DepositoId, dep.DepositoNombre, sucdep.SucursalDescripcion AS DepositoSucursalDescripcion,
          per.PersonalId, cuit.PersonalCUITCUILCUIT, IIF(per.PersonalId IS NULL,NULL,CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre))) ApellidoNombre,
          obj.ObjetivoId, cli.ClienteId, ele.ClienteElementoDependienteId, IIF(ele.ClienteElementoDependienteId IS NULL,NULL,CONCAT(cli.ClienteId,'/', ele.ClienteElementoDependienteId, ' ',ele.ClienteElementoDependienteDescripcion)) as ClienteElementoDependienteDescripcion,

          ISNULL(lpi.ListaPrecioIndividualPrecio,lp.ListaPrecioPrecio) as Importe,

          1
      FROM StockReal stk

      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId
      LEFT JOIN Efecto efe ON efe.EfectoId = stk.EfectoId

      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL and lp.ListaPrecioDesde<= @0 and ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi on lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0

      LEFT JOIN Proveedor pro ON pro.ProveedorId = stk.ProveedorId
      LEFT JOIN Sucursal sucpro ON sucpro.SucursalId = pro.ProveedorSucursalId

      LEFT JOIN Deposito dep ON dep.DepositoId = stk.DepositoId
      LEFT JOIN Sucursal sucdep ON sucdep.SucursalId = dep.DepositoSucursalId

      LEFT JOIN Objetivo obj ON obj.ObjetivoId = stk.ObjetivoId
      LEFT JOIN ClienteElementoDependiente ele on ele.ClienteElementoDependienteId=obj.ClienteElementoDependienteId and ele.ClienteId=obj.ClienteId
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN Sucursal sucobj ON sucobj.SucursalId = ISNULL(ele.ClienteElementoDependienteSucursalId, cli.ClienteSucursalId)

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
          efe.EfectoStockMinimo,

          1
      FROM StockReal stk
      LEFT JOIN ListaPrecio lp ON lp.EfectoId = stk.EfectoId AND stk.EfectoEfectoIndividualId IS NULL AND lp.ListaPrecioDesde <= @0 AND ISNULL(lp.ListaPrecioHasta, '9999-12-31') >= @0
      LEFT JOIN ListaPrecioIndividual lpi ON lpi.EfectoId = stk.EfectoId AND lpi.EfectoEfectoIndividualId = stk.EfectoEfectoIndividualId AND lpi.ListaPrecioIndividualDesde <= @0 AND ISNULL(lpi.ListaPrecioIndividualHasta, '9999-12-31') >= @0
      JOIN Proveedor pro ON pro.ProveedorId = stk.ProveedorId
      LEFT JOIN Sucursal suc ON suc.SucursalId = pro.ProveedorSucursalId
      LEFT JOIN Rubro ru ON ru.RubroId = stk.RubroId
      LEFT JOIN Subrubro sru ON sru.SubrubroId = stk.SubrubroId AND sru.RubroId = stk.RubroId
      LEFT JOIN Efecto efe ON efe.EfectoId = stk.EfectoId
      WHERE ${filterSql} `, [now])
  }

  // Opciones para el Select de Atributo del form de modificar/consultar efecto.
  async getAtributos(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await queryRunner.query(`
        SELECT AtributoId, TRIM(AtributoDescripcion) AS AtributoDescripcion
        FROM Atributo
        ORDER BY AtributoDescripcion
      `);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Opciones para el Select de Valor. Cada Valor pertenece a un Atributo (FK AtributoId): si viene
  // el atributoId se filtra por él, si no se devuelven todos.
  async getValores(req: any, res: Response, next: NextFunction) {
    const atributoIdRaw = req.query?.atributoId;
    const atributoId = atributoIdRaw === undefined || atributoIdRaw === '' || atributoIdRaw === 'null'
      ? null
      : Number(atributoIdRaw);
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await queryRunner.query(`
        SELECT ValorId, AtributoId, TRIM(ValorDescripcion) AS ValorDescripcion
        FROM Valor
        ${atributoId != null ? 'WHERE AtributoId = @0' : ''}
        ORDER BY ValorDescripcion
      `, atributoId != null ? [atributoId] : []);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Catálogo de tipos de atributo de ingreso (Select "Tipo" de las filas del individual). Es global
  // (no depende de rubro/subrubro/efecto), igual que Atributo; alimenta el combo también en el alta.
  async getAtributosIngreso(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const list = await queryRunner.query(`
        SELECT AtributoIngresoId, TRIM(AtributoIngresoDescripcion) AS AtributoIngresoDescripcion
        FROM AtributoIngreso
        ORDER BY AtributoIngresoDescripcion
      `);
      this.jsonRes(list, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Las lecturas de abajo las comparten el GET inicial del form y la respuesta del guardado, así
  // el front recibe siempre la misma forma y no hace falta que vuelva a consultar tras guardar.
  private async efectoAtributosDe(queryRunner: any, efectoId: number) {
    return await queryRunner.query(`
      SELECT EfectoAtributoId, EfectoAtributoAtributoId, EfectoAtributoValorId
      FROM EfectoAtributo
      WHERE EfectoId = @0
      ORDER BY EfectoAtributoId
    `, [efectoId]);
  }

  private async atributosIngresoDe(queryRunner: any, efectoId: number, individualId: number) {
    return await queryRunner.query(`
      SELECT
        efeatr.EfectoEfectoIndividualAtributoIngresoId,
        efeatr.EfectoAtributoAtributoIngresoId,
        TRIM(efeatr.EfectoAtributoIngresoValor) AS EfectoAtributoIngresoValor,
        TRIM(atr.AtributoIngresoDescripcion) AS AtributoDescripcion
      FROM EfectoEfectoIndividualAtributoIngreso efeatr
      LEFT JOIN AtributoIngreso atr ON atr.AtributoIngresoId = efeatr.EfectoAtributoAtributoIngresoId
      WHERE efeatr.EfectoId = @0 AND efeatr.EfectoEfectoIndividualId = @1
      ORDER BY efeatr.EfectoEfectoIndividualAtributoIngresoId
    `, [efectoId, individualId]);
  }

  private async formularioEfectoForm(
    queryRunner: any, efectoId: number, individualId: number | null
  ) {
    const efecto = await queryRunner.query(`
      SELECT EfectoId, TRIM(EfectoDescripcion) AS EfectoDescripcion, RubroId, SubrubroId, EfectoStockMinimo
      FROM Efecto
      WHERE EfectoId = @0
    `, [efectoId]);

    const individual = individualId != null
      ? await queryRunner.query(`
          SELECT TRIM(EfectoEfectoIndividualDescripcion) AS EfectoEfectoIndividualDescripcion
          FROM EfectoEfectoIndividual
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        `, [efectoId, individualId])
      : [];

    return {
      ...(efecto[0] ?? {}),
      EfectoEfectoIndividualId: individualId,
      EfectoEfectoIndividualDescripcion: individual[0]?.EfectoEfectoIndividualDescripcion ?? '',
      EfectoAtributos: await this.efectoAtributosDe(queryRunner, efectoId),
      atributos: individualId != null
        ? await this.atributosIngresoDe(queryRunner, efectoId, individualId)
        : [],
    };
  }

  // Carga inicial del form de modificar/consultar efecto: una sola llamada con todo lo que el form
  // necesita del efecto (cabecera, atributos, atributos de ingreso del individual y relaciones), en
  // la misma forma que devuelve el guardado más las relaciones (que son solo lectura).
  async getFormularioEfectoForm(req: any, res: Response, next: NextFunction) {
    const efectoId = Number(req.params.id);
    const individualIdRaw = req.query?.individualId;
    const individualId = individualIdRaw === undefined || individualIdRaw === '' || individualIdRaw === 'null'
      ? null
      : Number(individualIdRaw);
    if (!efectoId) {
      this.jsonRes(null, res);
      return;
    }
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const formulario = await this.formularioEfectoForm(queryRunner, efectoId, individualId);
      const relaciones = await this.relacionesDe(queryRunner, efectoId, individualId);
      this.jsonRes({ ...formulario, relaciones }, res);
    } catch (error) {
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async guardarEfectoForm(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const body = req.body ?? {};
      const efectoId = Number(body.EfectoId) || null;
      const descripcion = String(body.EfectoDescripcion ?? '').trim();
      const rubroId = Number(body.RubroId) || null;
      const subrubroId = Number(body.SubrubroId) || null;
      // La columna es NULL-able: vacío significa "sin mínimo definido", que no es lo mismo que 0.
      const stockMinimo = body.EfectoStockMinimo == null || body.EfectoStockMinimo === '' ? null : Number(body.EfectoStockMinimo);
      const individualId = body.EfectoEfectoIndividualId == null || body.EfectoEfectoIndividualId === ''
        ? null
        : Number(body.EfectoEfectoIndividualId);
      const individualDescripcion = String(body.EfectoEfectoIndividualDescripcion ?? '').trim();
      // Los atributos de ingreso cuelgan del efecto individual: sin individual no hay filas.
      const atributos = individualId != null && Array.isArray(body.atributos) ? body.atributos : [];
      // Atributos/valores del efecto (filas de EfectoAtributo, 1:N). Se descartan las filas sin
      // atributo. El valor solo tiene sentido con atributo: sin atributo se fuerza a null.
      const efectoAtributos = (Array.isArray(body.EfectoAtributos) ? body.EfectoAtributos : [])
        .map((row: any) => {
          const atributoId = row?.EfectoAtributoAtributoId == null || row?.EfectoAtributoAtributoId === ''
            ? null
            : Number(row.EfectoAtributoAtributoId);
          const valorId = atributoId == null || row?.EfectoAtributoValorId == null || row?.EfectoAtributoValorId === ''
            ? null
            : Number(row.EfectoAtributoValorId);
          const id = row?.EfectoAtributoId == null || row?.EfectoAtributoId === '' ? null : Number(row.EfectoAtributoId);
          return { EfectoAtributoId: id, EfectoAtributoAtributoId: atributoId, EfectoAtributoValorId: valorId };
        })
        .filter((row: any) => row.EfectoAtributoAtributoId != null);

      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const now = new Date();

      await this.validarEfectoForm(queryRunner, efectoId, descripcion, rubroId, subrubroId, stockMinimo, efectoAtributos, individualId, individualDescripcion, atributos);

      const claveAntes = await this.claveEfecto(queryRunner, efectoId!, individualId);

      // se comenta modificacion de stock minimo
      await queryRunner.query(`
        UPDATE Efecto
        SET EfectoDescripcion = @1, RubroId = @2, SubrubroId = @3, -- EfectoStockMinimo = @4,
            AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7
        WHERE EfectoId = @0
      `, [efectoId, descripcion, rubroId, subrubroId, stockMinimo, now, usuario, ip]);

      await this.guardarEfectoAtributos(queryRunner, efectoId!, efectoAtributos, now, usuario, ip);

      // El bloque de efecto individual solo aparece en el form si el efecto tiene individual.
      // La PK es el par (EfectoEfectoIndividualId, EfectoId).
      if (individualId != null) {
        await queryRunner.query(`
          UPDATE EfectoEfectoIndividual
          SET EfectoEfectoIndividualDescripcion = @2,
              AudFechaMod = @3, AudUsuarioMod = @4, AudIpMod = @5
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        `, [efectoId, individualId, individualDescripcion, now, usuario, ip]);

        await this.guardarAtributosIngreso(queryRunner, efectoId, individualId, atributos, now, usuario, ip);
      }

      // Con los cambios ya aplicados en la transacción, la clave del efecto (descripción + individual
      // + atributos ordenados) ya refleja lo que se acaba de guardar. Recién acá se puede verificar
      // que no colisione con la de otro efecto del catálogo.
      await this.validarDescripcionCompletaUnica(queryRunner, efectoId!, individualId, claveAntes);

      // Se relee dentro de la transacción, antes de cerrarla: es lo que se le devuelve al front.
      const formulario = await this.formularioEfectoForm(queryRunner, efectoId!, individualId);

      await queryRunner.commitTransaction();
      return this.jsonRes(formulario, res, 'Efecto guardado');
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async altaEfecto(req: any, res: Response, next: NextFunction) {

    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();
      const body = req.body ?? {};
      const descripcion = String(body.EfectoDescripcion ?? '').trim();
      const rubroId = Number(body.RubroId) || null;
      const subrubroId = Number(body.SubrubroId) || null;
      const stockMinimo = body.EfectoStockMinimo == null || body.EfectoStockMinimo === '' ? null : Number(body.EfectoStockMinimo);
      const individualDescripcion = String(body.EfectoEfectoIndividualDescripcion ?? '').trim();
      const atributosEfectoIndividual = Array.isArray(body.atributos) ? body.atributos : [];
      const crearEfectoIndividual = individualDescripcion.length > 0 || atributosEfectoIndividual.length > 0;
      const efectoAtributos = (Array.isArray(body.EfectoAtributos) ? body.EfectoAtributos : []).map((row: any) => {
        const atributoId = row?.EfectoAtributoAtributoId == null || row?.EfectoAtributoAtributoId === '' ? null : Number(row.EfectoAtributoAtributoId);
        const valorId = atributoId == null || row?.EfectoAtributoValorId == null || row?.EfectoAtributoValorId === '' ? null : Number(row.EfectoAtributoValorId);
        return { EfectoAtributoId: null, EfectoAtributoAtributoId: atributoId, EfectoAtributoValorId: valorId };
      }).filter((row: any) => row.EfectoAtributoAtributoId != null);

      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const now = new Date();

      await this.validarAltaEfectoForm(queryRunner, descripcion, rubroId, subrubroId, stockMinimo, efectoAtributos, crearEfectoIndividual, individualDescripcion, atributosEfectoIndividual);

      const nuevo = await queryRunner.query(`
        INSERT INTO Efecto
          (EfectoDescripcion, RubroId, SubrubroId, EfectoStockMinimo,
           EfectoAtributoUltNro, EfectoEfectoIndividualUltNro,
           AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @6, @7, @8);
        SELECT CAST(SCOPE_IDENTITY() AS DECIMAL(12, 0)) AS EfectoId;
        SELECT CAST(SCOPE_IDENTITY() AS DECIMAL(12, 0)) AS EfectoId;
      `, [descripcion, rubroId, subrubroId, stockMinimo, efectoAtributos.length, crearEfectoIndividual ? 1 : 0, now, usuario, ip]);

      const efectoId = Number(nuevo?.[0]?.EfectoId);
      if (!efectoId) throw new ClientException('No se pudo obtener el EfectoId asignado por la base.');

      await this.guardarEfectoAtributos(queryRunner, efectoId, efectoAtributos, now, usuario, ip);

      let individualId: number | null = null;
      if (crearEfectoIndividual) {
        // EfectoEfectoIndividualId es secuencial por efecto; para el primero arranca en 1.
        individualId = 1;
        // SuDescripcion es NOT NULL: se inserta un placeholder y se recalcula con la descripción
        // completa una vez insertados los atributos (que forman parte de esa cadena).
        await queryRunner.query(`
          INSERT INTO EfectoEfectoIndividual
            (EfectoEfectoIndividualId, EfectoId, EfectoEfectoIndividualDescripcion, EfectoEfectoIndividualSuDescripcion,
             EfectoEfectoIndividualAtributoIngresoUltNro,
             AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
          VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)
        `, [individualId, efectoId, individualDescripcion, individualDescripcion, 0, now, usuario, ip]);

        await this.guardarAtributosIngreso(queryRunner, efectoId, individualId, atributosEfectoIndividual, now, usuario, ip);

        await queryRunner.query(`UPDATE Efecto SET EfectoEfectoIndividualUltNro = 1 WHERE EfectoId = @0`, [efectoId]);

        const completo = await this.descripcionCompletaDe(queryRunner, efectoId, individualId);
        if (completo) {
          await queryRunner.query(`
            UPDATE EfectoEfectoIndividual SET EfectoEfectoIndividualSuDescripcion = @2
            WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
          `, [efectoId, individualId, String(completo).substring(0, 250)]);
        }
      }

      await this.validarDescripcionCompletaUnica(queryRunner, efectoId, individualId, null);

      const formulario = await this.formularioEfectoForm(queryRunner, efectoId, individualId);

      await queryRunner.commitTransaction();
      // Devuelve el formulario ya persistido: el front lo usa para pasar a modificación del nuevo efecto.
      return this.jsonRes(formulario, res, `Efecto ${efectoId} dado de alta exitosamente`);
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Alta de un efecto individual: parte de un efecto ya existente (elegido en el buscador) y crea
  // sólo un EfectoEfectoIndividual nuevo (+ sus atributos de ingreso). No toca el Efecto ni sus
  // EfectoAtributo.
  async altaEfectoIndividual(req: any, res: Response, next: NextFunction) {

    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      const body = req.body ?? {};
      const efectoId = Number(body.EfectoId) || null;
      const individualDescripcion = String(body.EfectoEfectoIndividualDescripcion ?? '').trim();
      const atributos = Array.isArray(body.atributos) ? body.atributos : [];

      const usuario = res.locals.userName;
      const ip = this.getRemoteAddress(req);
      const now = new Date();

      await this.validarAltaEfectoIndividualForm(queryRunner, efectoId, individualDescripcion, atributos);

      // EfectoEfectoIndividualId es secuencial por efecto (parte de la PK compuesta): MAX+1 del efecto.
      const maxInd = await queryRunner.query(`
        SELECT ISNULL(MAX(EfectoEfectoIndividualId), 0) AS MaxId
        FROM EfectoEfectoIndividual WHERE EfectoId = @0
      `, [efectoId]);
      const individualId = Number(maxInd[0]?.MaxId ?? 0) + 1;

      // SuDescripcion es NOT NULL: placeholder que se recalcula con la descripción completa una vez
      // insertados los atributos.
      await queryRunner.query(`
        INSERT INTO EfectoEfectoIndividual
          (EfectoEfectoIndividualId, EfectoId, EfectoEfectoIndividualDescripcion, EfectoEfectoIndividualSuDescripcion,
           EfectoEfectoIndividualAtributoIngresoUltNro,
           AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @5, @6, @7)
      `, [individualId, efectoId, individualDescripcion, individualDescripcion, 0, now, usuario, ip]);

      // Inserta los atributos de ingreso y actualiza el UltNro del individual.
      await this.guardarAtributosIngreso(queryRunner, efectoId!, individualId, atributos, now, usuario, ip);

      // Último individual del efecto.
      await queryRunner.query(`UPDATE Efecto SET EfectoEfectoIndividualUltNro = @1 WHERE EfectoId = @0`, [efectoId, individualId]);

      // SuDescripcion = descripción completa (efecto + individual + atributos), leída de la vista ya
      // con los hijos insertados. Se recorta a los 250 de la columna.
      const completo = await this.descripcionCompletaDe(queryRunner, efectoId!, individualId);
      if (completo) {
        await queryRunner.query(`
          UPDATE EfectoEfectoIndividual SET EfectoEfectoIndividualSuDescripcion = @2
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        `, [efectoId, individualId, String(completo).substring(0, 250)]);
      }

      // La descripción completa del nuevo individual no debe colisionar con otro del catálogo.
      await this.validarDescripcionCompletaUnica(queryRunner, efectoId!, individualId, null);

      const formulario = await this.formularioEfectoForm(queryRunner, efectoId!, individualId);

      // Poné PROBANDO = true para volver al modo prueba (arma todo pero hace rollback sin impactar).
      const PROBANDO: boolean = false;
      if (PROBANDO)
        throw new ClientException(`PRUEBA OK: efecto ${efectoId} / individual ${individualId} armado sin impactar las tablas.`);

      await queryRunner.commitTransaction();
      // Devuelve el formulario ya persistido: el front lo usa para pasar a modificación del efecto.
      return this.jsonRes(formulario, res, `Efecto individual ${individualId} dado de alta exitosamente`);
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  async eliminarEfectoForm(req: any, res: any, next: any) {
    const queryRunner = await getConnection(res.locals.userName);
    const efectoId = Number(req.body.EfectoId) || null;
    const individualId = (req.body.EfectoEfectoIndividualId === null || req.body.EfectoEfectoIndividualId === undefined || req.body.EfectoEfectoIndividualId === '')
      ? null : Number(req.body.EfectoEfectoIndividualId);

    try {
      await this.validarBajaEfectoForm(queryRunner, efectoId, individualId);

      await queryRunner.startTransaction();

      if (individualId != null) {
        await queryRunner.query(`
          DELETE FROM EfectoEfectoIndividualAtributoIngreso
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        `, [efectoId, individualId]);

        await queryRunner.query(`
          DELETE FROM EfectoEfectoIndividual
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
        `, [efectoId, individualId]);
      } else {
        await queryRunner.query(`DELETE FROM EfectoAtributo WHERE EfectoId = @0`, [efectoId]);
        await queryRunner.query(`DELETE FROM Efecto WHERE EfectoId = @0`, [efectoId]);
      }

      await queryRunner.commitTransaction();

      return this.jsonRes(
        { EfectoId: efectoId, EfectoEfectoIndividualId: individualId },
        res,
        individualId != null ? 'Efecto individual eliminado' : 'Efecto eliminado'
      );
    } catch (error) {
      await this.rollbackTransaction(queryRunner);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  }

  // Un efecto (o individual) solo se puede borrar si no quedó nada colgando: sin stock en ninguna
  // ubicación (vista StockReal) y sin aparecer en ningún detalle de movimiento de stock.
  private async validarBajaEfectoForm(
    queryRunner: any, efectoId: number | null, individualId: number | null
  ) {
    if (!efectoId)
      throw new ClientException('No se recibió el efecto a eliminar.');

    const errores: string[] = [];

    if (individualId != null) {
      const individual = await queryRunner.query(`
        SELECT EfectoEfectoIndividualId FROM EfectoEfectoIndividual
        WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
      `, [efectoId, individualId]);
      if (!individual.length)
        throw new ClientException(`No existe el efecto individual ${individualId} para el efecto ${efectoId}.`);
    } else {
      const efecto = await queryRunner.query(`SELECT EfectoId FROM Efecto WHERE EfectoId = @0`, [efectoId]);
      if (!efecto.length)
        throw new ClientException(`No existe el efecto ${efectoId}.`);

      // Borrar el efecto dejaría huérfanos a sus individuales: primero hay que dar de baja cada uno.
      const individuales = await queryRunner.query(`
        SELECT COUNT(*) AS Cantidad FROM EfectoEfectoIndividual WHERE EfectoId = @0
      `, [efectoId]);
      if (Number(individuales[0]?.Cantidad ?? 0) > 0)
        errores.push(`El efecto tiene ${individuales[0].Cantidad} efecto(s) individual(es) asociado(s): debe eliminarlos primero.`);
    }

    // Al borrar el efecto entero se mira el stock y los movimientos de todos sus individuales; al
    // borrar un individual, solo los de ese individual.
    const filtroStock = individualId != null ? 'AND stk.EfectoEfectoIndividualId = @1' : '';
    const filtroDetalle = individualId != null ? 'AND det.EfectoIndividualId = @1' : '';
    const params = individualId != null ? [efectoId, individualId] : [efectoId];

    const conStock = await queryRunner.query(`
      SELECT TOP 1 1 AS Existe FROM StockReal stk
      WHERE stk.EfectoId = @0 ${filtroStock} AND ISNULL(stk.StockStock, 0) <> 0
    `, params);
    if (conStock.length)
      errores.push('No se puede eliminar: todavía tiene stock en alguna ubicación.');

    const enMovimientos = await queryRunner.query(`
      SELECT TOP 1 1 AS Existe FROM MovimientoStockDetalle det
      WHERE det.EfectoId = @0 ${filtroDetalle}
    `, params);
    if (enMovimientos.length)
      errores.push('No se puede eliminar: está asociado a movimientos de stock.');

    if (errores.length)
      throw new ClientException(errores);
  }

  // Descripción completa (efecto + individual + atributos) leída de las vistas, igual que claveEfecto
  // pero con COMPLETO_EXPR. Se usa para poblar EfectoEfectoIndividualSuDescripcion en el alta.
  private async descripcionCompletaDe(
    queryRunner: any, efectoId: number, individualId: number | null
  ): Promise<string | null> {
    const rows = await queryRunner.query(`
      SELECT ${EfectoController.COMPLETO_EXPR} AS Completo
      FROM EfectoDescripcion efe
      LEFT JOIN EfectoIndividualDescripcion efeind
        ON efeind.EfectoId = efe.EfectoId AND efeind.EfectoEfectoIndividualId = @1
      WHERE efe.EfectoId = @0
    `, [efectoId, individualId ?? null]);
    return rows[0]?.Completo ?? null;
  }

  // Validación del alta de efecto individual: el efecto base ya existe (tiene que existir) y se crea
  // un individual nuevo con su descripción y sus atributos de ingreso.
  private async validarAltaEfectoIndividualForm(
    queryRunner: any, efectoId: number | null, individualDescripcion: string, atributos: any[]
  ) {
    if (!efectoId)
      throw new ClientException('No se recibió el efecto de partida.');

    const errores: string[] = [];

    if (individualDescripcion.length > 60)
      errores.push(`La descripción individual no puede superar los 60 caracteres (tiene ${individualDescripcion.length}).`);

    const efecto = await queryRunner.query(`SELECT EfectoId FROM Efecto WHERE EfectoId = @0`, [efectoId]);
    if (!efecto.length)
      errores.push(`No existe el efecto ${efectoId}.`);

    // Atributos de ingreso: ambas columnas son NOT NULL y el valor es CHAR(40).
    const atributosVistos = new Set<number>();
    for (const [idx, row] of atributos.entries()) {
      const nro = idx + 1;
      const atributoId = Number(row?.EfectoAtributoAtributoIngresoId) || null;
      const valor = String(row?.EfectoAtributoIngresoValor ?? '').trim();

      if (!atributoId) {
        errores.push(`Atributo #${nro}: debe seleccionar el atributo.`);
        continue;
      }
      if (!valor) {
        errores.push(`Atributo #${nro}: debe ingresar el valor.`);
        continue;
      }
      if (valor.length > 40)
        errores.push(`Atributo #${nro}: el valor no puede superar los 40 caracteres (tiene ${valor.length}).`);
      if (atributosVistos.has(atributoId))
        errores.push(`Atributo #${nro}: el atributo está repetido.`);
      atributosVistos.add(atributoId);
    }

    if (atributosVistos.size) {
      const existentes = await queryRunner.query(`
        SELECT AtributoIngresoId FROM AtributoIngreso WHERE AtributoIngresoId IN (${[...atributosVistos].join(',')})
      `);
      const validos = new Set(existentes.map((row: any) => Number(row.AtributoIngresoId)));
      for (const atributoId of atributosVistos)
        if (!validos.has(atributoId)) errores.push(`No existe el atributo de ingreso ${atributoId}.`);
    }

    if (errores.length)
      throw new ClientException(errores);
  }

  // Validación del alta de efecto. Espeja a validarEfectoForm pero sin los chequeos de existencia
  // (el efecto/individual todavía no existen) ni de Ids propios (las filas son todas nuevas).
  private async validarAltaEfectoForm(
    queryRunner: any, descripcion: string, rubroId: number | null, subrubroId: number | null,
    stockMinimo: number | null, efectoAtributos: any[],
    crearIndividual: boolean, individualDescripcion: string, atributos: any[]
  ) {
    // Todas estas columnas son NOT NULL.
    const camposVacios: string[] = [];
    if (!descripcion) camposVacios.push('- Descripción');
    if (!rubroId) camposVacios.push('- Rubro');
    if (!subrubroId) camposVacios.push('- Subrubro');
    if (camposVacios.length) {
      camposVacios.unshift('Debe completar los siguientes campos:');
      throw new ClientException(camposVacios);
    }

    const errores: string[] = [];

    if (descripcion.length > 100)
      errores.push(`La descripción no puede superar los 100 caracteres (tiene ${descripcion.length}).`);
    if (crearIndividual && individualDescripcion.length > 60)
      errores.push(`La descripción individual no puede superar los 60 caracteres (tiene ${individualDescripcion.length}).`);

    const descripcionRepetida = await this.buscarEfectoConMismaDescripcion(queryRunner, descripcion, null);
    if (descripcionRepetida) errores.push(descripcionRepetida);

    if (stockMinimo != null) {
      if (!Number.isFinite(stockMinimo))
        errores.push('El stock mínimo debe ser un número.');
      else if (stockMinimo < 0)
        errores.push('El stock mínimo no puede ser negativo.');
    }

    // SubrubroId no es único: solo tiene sentido dentro de un RubroId (la FK de Efecto es el par).
    const subrubro = await queryRunner.query(`
      SELECT SubrubroId FROM Subrubro WHERE RubroId = @0 AND SubrubroId = @1
    `, [rubroId, subrubroId]);
    if (!subrubro.length)
      errores.push('El subrubro seleccionado no pertenece al rubro seleccionado.');

    // Filas de EfectoAtributo. Cada atributo tiene que existir y su valor (si viene) pertenecer a él
    // (Valor.AtributoId). El atributo no puede repetirse entre filas.
    const atributosEfectoVistos = new Set<number>();
    for (const [idx, fila] of efectoAtributos.entries()) {
      const nro = idx + 1;
      const atributoId = Number(fila?.EfectoAtributoAtributoId) || null;
      const valorId = fila?.EfectoAtributoValorId == null ? null : Number(fila.EfectoAtributoValorId);
      if (!atributoId) continue;

      if (atributosEfectoVistos.has(atributoId)) {
        errores.push(`Fila Atributo #${nro}: el atributo está repetido.`);
        continue;
      }
      atributosEfectoVistos.add(atributoId);

      // El estado "Usado" no se carga a mano: lo determina la transformación del efecto original.
      if (atributoId === 11 && valorId === 2) {
        errores.push(`Fila Atributo #${nro}: no se puede asignar el atributo "Usado" a un efecto.`);
        continue;
      }

      const atr = await queryRunner.query(`SELECT AtributoId FROM Atributo WHERE AtributoId = @0`, [atributoId]);
      if (!atr.length) {
        errores.push(`Fila Atributo #${nro}: no existe el atributo ${atributoId}.`);
        continue;
      }
      if (valorId != null) {
        const val = await queryRunner.query(`
          SELECT ValorId FROM Valor WHERE ValorId = @0 AND AtributoId = @1
        `, [valorId, atributoId]);
        if (!val.length)
          errores.push(`Fila Atributo #${nro}: el valor no pertenece al atributo seleccionado.`);
      }
    }

    // Atributos de ingreso: solo si se crea el individual. Ambas columnas son NOT NULL y el valor es CHAR(40).
    if (crearIndividual) {
      const atributosVistos = new Set<number>();
      for (const [idx, row] of atributos.entries()) {
        const nro = idx + 1;
        const atributoId = Number(row?.EfectoAtributoAtributoIngresoId) || null;
        const valor = String(row?.EfectoAtributoIngresoValor ?? '').trim();

        if (!atributoId) {
          errores.push(`Fila Atributo #${nro}: debe seleccionar el atributo.`);
          continue;
        }
        if (!valor) {
          errores.push(`Fila Atributo #${nro}: debe ingresar el valor.`);
          continue;
        }
        if (valor.length > 40)
          errores.push(`Fila Atributo #${nro}: el valor no puede superar los 40 caracteres (tiene ${valor.length}).`);
        if (atributosVistos.has(atributoId))
          errores.push(`Fila Atributo #${nro}: el atributo está repetido.`);
        atributosVistos.add(atributoId);
      }

      if (atributosVistos.size) {
        // La FK de EfectoAtributoAtributoIngresoId es a AtributoIngreso, no a Atributo.
        const existentes = await queryRunner.query(`
          SELECT AtributoIngresoId FROM AtributoIngreso WHERE AtributoIngresoId IN (${[...atributosVistos].join(',')})
        `);
        const validos = new Set(existentes.map((row: any) => Number(row.AtributoIngresoId)));
        for (const atributoId of atributosVistos)
          if (!validos.has(atributoId)) errores.push(`No existe el atributo de ingreso ${atributoId}.`);
      }
    }

    if (errores.length)
      throw new ClientException(errores);
  }

  // Sincroniza las filas de EfectoAtributo del efecto (tabla 1:N): baja lo que ya no viene, actualiza
  // las que traen Id y da de alta las nuevas. Mismo esquema que guardarAtributosIngreso.
  private async guardarEfectoAtributos(
    queryRunner: any, efectoId: number, filas: any[], now: Date, usuario: string, ip: string
  ) {
    // Bajas: lo que el usuario sacó de la grilla ya no viene en el payload.
    const conservados = filas
      .map(f => Number(f?.EfectoAtributoId))
      .filter(id => Number.isFinite(id) && id > 0);
    if (conservados.length) {
      await queryRunner.query(`
        DELETE FROM EfectoAtributo
        WHERE EfectoId = @0 AND EfectoAtributoId NOT IN (${conservados.join(',')})
      `, [efectoId]);
    } else {
      await queryRunner.query(`DELETE FROM EfectoAtributo WHERE EfectoId = @0`, [efectoId]);
    }

    // EfectoAtributoId es secuencial por efecto (parte de la PK compuesta con EfectoId).
    const max = await queryRunner.query(`
      SELECT ISNULL(MAX(EfectoAtributoId), 0) AS MaxId FROM EfectoAtributo WHERE EfectoId = @0
    `, [efectoId]);
    let ultId = Number(max[0]?.MaxId ?? 0);

    for (const fila of filas) {
      const id = Number(fila?.EfectoAtributoId);
      const atributoId = fila?.EfectoAtributoAtributoId ?? null;
      const valorId = fila?.EfectoAtributoValorId ?? null;

      if (Number.isFinite(id) && id > 0) {
        await queryRunner.query(`
          UPDATE EfectoAtributo
          SET EfectoAtributoAtributoId = @2, EfectoAtributoValorId = @3,
              AudFechaMod = @4, AudUsuarioMod = @5, AudIpMod = @6
          WHERE EfectoId = @0 AND EfectoAtributoId = @1
        `, [efectoId, id, atributoId, valorId, now, usuario, ip]);
      } else {
        ultId++;
        await queryRunner.query(`
          INSERT INTO EfectoAtributo
            (EfectoAtributoId, EfectoId, EfectoAtributoAtributoId, EfectoAtributoValorId,
             AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
          VALUES (@0, @1, @2, @3, @4, @5, @6, @4, @5, @6)
        `, [ultId, efectoId, atributoId, valorId, now, usuario, ip]);
      }
    }
  }

  private idsAtributosIngreso(atributos: any[]): number[] {
    return atributos
      .map(row => Number(row?.EfectoEfectoIndividualAtributoIngresoId))
      .filter(id => Number.isFinite(id) && id > 0);
  }

  private async guardarAtributosIngreso(
    queryRunner: any, efectoId: number, individualId: number, atributos: any[],
    now: Date, usuario: string, ip: string
  ) {
    // Bajas: lo que el usuario sacó de la grilla ya no viene en el payload.
    const conservados = this.idsAtributosIngreso(atributos);
    if (conservados.length) {
      await queryRunner.query(`
        DELETE FROM EfectoEfectoIndividualAtributoIngreso
        WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
          AND EfectoEfectoIndividualAtributoIngresoId NOT IN (${conservados.join(',')})
      `, [efectoId, individualId]);
    } else {
      await queryRunner.query(`
        DELETE FROM EfectoEfectoIndividualAtributoIngreso
        WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
      `, [efectoId, individualId]);
    }

    const individual = await queryRunner.query(`
      SELECT ISNULL(ind.EfectoEfectoIndividualAtributoIngresoUltNro, 0) AS UltNro,
        ISNULL((
          SELECT MAX(atr.EfectoEfectoIndividualAtributoIngresoId)
          FROM EfectoEfectoIndividualAtributoIngreso atr
          WHERE atr.EfectoId = ind.EfectoId AND atr.EfectoEfectoIndividualId = ind.EfectoEfectoIndividualId
        ), 0) AS MaxId
      FROM EfectoEfectoIndividual ind
      WHERE ind.EfectoId = @0 AND ind.EfectoEfectoIndividualId = @1
    `, [efectoId, individualId]);
    let ultNro = Math.max(Number(individual[0]?.UltNro ?? 0), Number(individual[0]?.MaxId ?? 0));

    for (const row of atributos) {
      const id = Number(row?.EfectoEfectoIndividualAtributoIngresoId);
      const atributoId = Number(row?.EfectoAtributoAtributoIngresoId);
      const valor = String(row?.EfectoAtributoIngresoValor ?? '').trim();

      if (Number.isFinite(id) && id > 0) {
        await queryRunner.query(`
          UPDATE EfectoEfectoIndividualAtributoIngreso
          SET EfectoAtributoAtributoIngresoId = @3, EfectoAtributoIngresoValor = @4,
              AudFechaMod = @5, AudUsuarioMod = @6, AudIpMod = @7
          WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
            AND EfectoEfectoIndividualAtributoIngresoId = @2
        `, [efectoId, individualId, id, atributoId, valor, now, usuario, ip]);
      } else {
        ultNro++;
        await queryRunner.query(`
          INSERT INTO EfectoEfectoIndividualAtributoIngreso
            (EfectoEfectoIndividualAtributoIngresoId, EfectoId, EfectoEfectoIndividualId,
             EfectoAtributoAtributoIngresoId, EfectoAtributoIngresoValor,
             AudFechaIng, AudUsuarioIng, AudIpIng, AudFechaMod, AudUsuarioMod, AudIpMod)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@5,@6,@7)
        `, [ultNro, efectoId, individualId, atributoId, valor, now, usuario, ip]);
      }
    }

    await queryRunner.query(`
      UPDATE EfectoEfectoIndividual
      SET EfectoEfectoIndividualAtributoIngresoUltNro = @2
      WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
    `, [efectoId, individualId, ultNro]);
  }

  // Concatenación que muestra el buscador (descripción + descripción individual + atributos del
  // efecto e individual). La arman las vistas EfectoDescripcion / EfectoIndividualDescripcion, así
  // que es la fuente de verdad del string; se lee de la base en vez de rearmarlo en código.
  private static readonly COMPLETO_EXPR = `CONCAT(TRIM(efe.EfectoDescripcion), ' - ', TRIM(efeind.EfectoEfectoIndividualDescripcion), ' (', efe.EfectoAtrDescripcion, ', ', efeind.EfectoIndividualAtrDescripcion, ' )')`;

  private static readonly CLAVE_EXPR = (() => {
    // Cada atributo del efecto se identifica por su par (descripción del atributo, descripción del
    // valor). ValorId es secuencial dentro de su Atributo, así que el join va por las dos columnas.
    const parEfecto = `CONCAT(UPPER(TRIM(atr.AtributoDescripcion)), ' ', UPPER(TRIM(val.ValorDescripcion)))`;
    // En el individual el valor es texto libre cargado en la propia fila.
    const parIngreso = `CONCAT(UPPER(TRIM(atring.AtributoIngresoDescripcion)), ' ', UPPER(TRIM(efeatr.EfectoAtributoIngresoValor)))`;
    return `CONCAT(
      UPPER(TRIM(efe.EfectoDescripcion)), '|',
      ISNULL(UPPER(TRIM(efeind.EfectoEfectoIndividualDescripcion)), ''), '|',
      ISNULL((
        SELECT STRING_AGG(${parEfecto}, ',') WITHIN GROUP (ORDER BY ${parEfecto})
        FROM EfectoAtributo efeatr
        LEFT JOIN Atributo atr ON atr.AtributoId = efeatr.EfectoAtributoAtributoId
        LEFT JOIN Valor val ON val.AtributoId = efeatr.EfectoAtributoAtributoId
          AND val.ValorId = efeatr.EfectoAtributoValorId
        WHERE efeatr.EfectoId = efe.EfectoId
      ), ''), '|',
      ISNULL((
        SELECT STRING_AGG(${parIngreso}, ',') WITHIN GROUP (ORDER BY ${parIngreso})
        FROM EfectoEfectoIndividualAtributoIngreso efeatr
        LEFT JOIN AtributoIngreso atring
          ON atring.AtributoIngresoId = efeatr.EfectoAtributoAtributoIngresoId
        WHERE efeatr.EfectoId = efeind.EfectoId
          AND efeatr.EfectoEfectoIndividualId = efeind.EfectoEfectoIndividualId
      ), '')
    )`;
  })();

  private async claveEfecto(
    queryRunner: any, efectoId: number, individualId: number | null
  ): Promise<string | null> {
    const rows = await queryRunner.query(`
      SELECT ${EfectoController.CLAVE_EXPR} AS Clave
      FROM EfectoDescripcion efe
      LEFT JOIN EfectoIndividualDescripcion efeind
        ON efeind.EfectoId = efe.EfectoId AND efeind.EfectoEfectoIndividualId = @1
      WHERE efe.EfectoId = @0
    `, [efectoId, individualId ?? null]);
    return rows[0]?.Clave ?? null;
  }

  private async buscarEfectoConMismaDescripcion(
    queryRunner: any, descripcion: string, efectoId: number | null
  ) {
    const dup = await queryRunner.query(`
      SELECT TOP 1 EfectoId, EfectoDescripcion FROM Efecto
      WHERE UPPER(TRIM(EfectoDescripcion)) = UPPER(TRIM(@0))
        AND (@1 IS NULL OR EfectoId <> @1)
    `, [descripcion, efectoId ?? null]);

    return dup.length
      ? `Ya existe el efecto ${dup[0].EfectoId} con la descripción "${String(dup[0].EfectoDescripcion).trim()}".`
      : null;
  }

  private async validarDescripcionCompletaUnica(
    queryRunner: any, efectoId: number, individualId: number | null, claveAntes: string | null
  ) {
    const clave = await this.claveEfecto(queryRunner, efectoId, individualId);
    if (!clave) return;
    if (clave === claveAntes) return;

    // La descripción es el primer tramo de la clave. Se compara aparte para que el filtro descarte
    // la mayoría del catálogo antes de tener que armar los STRING_AGG de atributos de cada efecto.
    const descripcionNorm = clave.split('|')[0];

    const dup = await queryRunner.query(`
      SELECT TOP 1 efe.EfectoId, efeind.EfectoEfectoIndividualId, ${EfectoController.COMPLETO_EXPR} AS Completo
      FROM EfectoDescripcion efe
      LEFT JOIN EfectoIndividualDescripcion efeind ON efeind.EfectoId = efe.EfectoId
      WHERE UPPER(TRIM(efe.EfectoDescripcion)) = @3
        AND ${EfectoController.CLAVE_EXPR} = @1
        AND NOT (efe.EfectoId = @0 AND (
          efeind.EfectoEfectoIndividualId = @2
          OR (efeind.EfectoEfectoIndividualId IS NULL AND @2 IS NULL)
        ))
    `, [efectoId, clave, individualId ?? null, descripcionNorm]);

    if (dup.length) {
      const otro = dup[0];

      throw new ClientException([
        'Ya existe otro efecto con la misma descripción completa:',
        `"${String(otro.Completo).trim()}"`
      ]);
    }
  }

  private async validarEfectoForm(
    queryRunner: any, efectoId: number | null, descripcion: string, rubroId: number | null,
    subrubroId: number | null, stockMinimo: number | null, efectoAtributos: any[],
    individualId: number | null,
    individualDescripcion: string, atributos: any[]
  ) {
    if (!efectoId)
      throw new ClientException('No se recibió el efecto a modificar.');

    // Todas estas columnas son NOT NULL.
    const camposVacios: string[] = [];
    if (!descripcion) camposVacios.push('- Descripción');
    if (!rubroId) camposVacios.push('- Rubro');
    if (!subrubroId) camposVacios.push('- Subrubro');
    if (camposVacios.length) {
      camposVacios.unshift('Debe completar los siguientes campos:');
      throw new ClientException(camposVacios);
    }

    const errores: string[] = [];

    // Los largos se validan acá para no truncar silenciosamente contra el tipo de la columna.
    if (descripcion.length > 100)
      errores.push(`La descripción no puede superar los 100 caracteres (tiene ${descripcion.length}).`);
    if (individualId != null && individualDescripcion.length > 60)
      errores.push(`La descripción individual no puede superar los 60 caracteres (tiene ${individualDescripcion.length}).`);

    const descripcionRepetida = await this.buscarEfectoConMismaDescripcion(queryRunner, descripcion, efectoId);
    if (descripcionRepetida) errores.push(descripcionRepetida);

    // if (stockMinimo != null) {
    //   if (!Number.isFinite(stockMinimo))
    //     errores.push('El stock mínimo debe ser un número.');
    //   else if (stockMinimo < 0)
    //     errores.push('El stock mínimo no puede ser negativo.');
    // }

    const efecto = await queryRunner.query(`SELECT EfectoId FROM Efecto WHERE EfectoId = @0`, [efectoId]);
    if (!efecto.length)
      errores.push(`No existe el efecto ${efectoId}.`);

    const isUsado = await queryRunner.query(`
      SELECT ef.EfectoId, ed.EfectoDescripcion 
      FROM Efecto ef
      left join EfectoDescripcion ed on ed.EfectoId = ef.EfectoId
      WHERE ef.EfectoEfectoTransformacionEfectoId=@0
    `, [efectoId]);

    if (isUsado.length) errores.push(`No se puede modificar el efecto. Debe modificar el efecto Original ${isUsado[0].EfectoId}. (${isUsado[0].EfectoDescripcion})`);

    if (individualId != null) {
      const individual = await queryRunner.query(`
        SELECT EfectoEfectoIndividualId FROM EfectoEfectoIndividual
        WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
      `, [efectoId, individualId]);
      if (!individual.length)
        errores.push(`No existe el efecto individual ${individualId} para el efecto ${efectoId}.`);
    }

    // SubrubroId no es único: solo tiene sentido dentro de un RubroId (la FK de Efecto es el par).
    const subrubro = await queryRunner.query(`
      SELECT SubrubroId FROM Subrubro WHERE RubroId = @0 AND SubrubroId = @1
    `, [rubroId, subrubroId]);
    if (!subrubro.length)
      errores.push('El subrubro seleccionado no pertenece al rubro seleccionado.');

    // Filas de EfectoAtributo. Cada atributo tiene que existir y su valor (si viene) pertenecer a él
    // (Valor.AtributoId). El atributo no puede repetirse entre filas.
    const atributosEfectoVistos = new Set<number>();
    for (const [idx, fila] of efectoAtributos.entries()) {
      const nro = idx + 1;
      const atributoId = Number(fila?.EfectoAtributoAtributoId) || null;
      const valorId = fila?.EfectoAtributoValorId == null ? null : Number(fila.EfectoAtributoValorId);
      if (!atributoId) continue;

      if (atributosEfectoVistos.has(atributoId)) {
        errores.push(`Atributo/Valor #${nro}: el atributo está repetido.`);
        continue;
      }
      atributosEfectoVistos.add(atributoId);

      // El estado "Usado" no se carga a mano: lo determina la transformación del efecto original.
      if (atributoId === 11 && valorId === 2) {
        errores.push(`Atributo/Valor #${nro}: no se puede asignar el atributo "Usado" a un efecto.`);
        continue;
      }

      const atr = await queryRunner.query(`SELECT AtributoId FROM Atributo WHERE AtributoId = @0`, [atributoId]);
      if (!atr.length) {
        errores.push(`Atributo/Valor #${nro}: no existe el atributo ${atributoId}.`);
        continue;
      }
      if (valorId != null) {
        const val = await queryRunner.query(`
          SELECT ValorId FROM Valor WHERE ValorId = @0 AND AtributoId = @1
        `, [valorId, atributoId]);
        if (!val.length)
          errores.push(`Atributo/Valor #${nro}: el valor no pertenece al atributo seleccionado.`);
      }
    }

    // Atributos de ingreso: ambas columnas son NOT NULL y el valor es CHAR(40).
    const atributosVistos = new Set<number>();
    for (const [idx, row] of atributos.entries()) {
      const nro = idx + 1;
      const atributoId = Number(row?.EfectoAtributoAtributoIngresoId) || null;
      const valor = String(row?.EfectoAtributoIngresoValor ?? '').trim();

      if (!atributoId) {
        errores.push(`Atributo #${nro}: debe seleccionar el atributo.`);
        continue;
      }
      if (!valor) {
        errores.push(`Atributo #${nro}: debe ingresar el valor.`);
        continue;
      }
      if (valor.length > 40)
        errores.push(`Atributo #${nro}: el valor no puede superar los 40 caracteres (tiene ${valor.length}).`);
      if (atributosVistos.has(atributoId))
        errores.push(`Atributo #${nro}: el atributo está repetido.`);
      atributosVistos.add(atributoId);
    }

    if (atributosVistos.size) {
      // La FK de EfectoAtributoAtributoIngresoId es a AtributoIngreso, no a Atributo.
      const existentes = await queryRunner.query(`
        SELECT AtributoIngresoId FROM AtributoIngreso WHERE AtributoIngresoId IN (${[...atributosVistos].join(',')})
      `);
      const validos = new Set(existentes.map((row: any) => Number(row.AtributoIngresoId)));
      for (const atributoId of atributosVistos)
        if (!validos.has(atributoId)) errores.push(`No existe el atributo de ingreso ${atributoId}.`);
    }

    // Un Id que no pertenezca a este individual haría que el UPDATE no afecte ninguna fila y el
    // cambio se perdiera sin aviso.
    const ids = this.idsAtributosIngreso(atributos);
    if (ids.length) {
      const propias = await queryRunner.query(`
        SELECT EfectoEfectoIndividualAtributoIngresoId AS Id
        FROM EfectoEfectoIndividualAtributoIngreso
        WHERE EfectoId = @0 AND EfectoEfectoIndividualId = @1
      `, [efectoId, individualId]);
      const validas = new Set(propias.map((row: any) => Number(row.Id)));
      for (const id of ids)
        if (!validas.has(id)) errores.push(`El atributo ${id} no pertenece al efecto individual.`);
    }

    if (errores.length)
      throw new ClientException(errores);
  }

}
