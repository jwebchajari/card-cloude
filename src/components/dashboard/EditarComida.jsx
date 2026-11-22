"use client";
import { useParams } from "next/navigation";
import ComidaForm from "./ComidaForm";

export default function EditarComida() {
  const { id } = useParams();
  return <ComidaForm key={id} id={id} />;
}
