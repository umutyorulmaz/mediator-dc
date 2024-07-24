// src/dependencies/TsyringeContainerWrapper.ts
import { container, DependencyContainer } from "tsyringe";

export class TsyringeContainerWrapper {
  private container: DependencyContainer;

  constructor(container: DependencyContainer) {
    this.container = container;
  }

  get(someClass: any) {
    return this.container.resolve(someClass);
  }
}
