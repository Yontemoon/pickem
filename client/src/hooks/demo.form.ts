import { createFormHook } from "@tanstack/react-form"

import {
  Select,
  SubscribeButton,
  TextField,
} from "../components/demo.FormComponents"
import { fieldContext, formContext } from "./demo.form-context"

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
