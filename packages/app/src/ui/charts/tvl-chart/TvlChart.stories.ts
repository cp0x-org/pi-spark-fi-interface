import { cn } from '@/ui/utils/style'
import { WithClassname } from '@sb/decorators'
import { getMobileStory, getTabletStory } from '@sb/viewports'
import { Meta, StoryObj } from '@storybook/react'
import { mockTvlChartData } from '../fixtures/mockTvlChartData'
import { TvlChart } from './TvlChart'

const meta: Meta<typeof TvlChart> = {
  title: 'Components/Charts/TvlChart',
  component: TvlChart,
  decorators: [WithClassname('max-w-lg')],
  args: {
    height: 320,
    width: 512,
    data: mockTvlChartData,
    primaryColor: '#FA43BD',
  },
}

export default meta
type Story = StoryObj<typeof TvlChart>

export const Desktop: Story = {}
export const Tablet = getTabletStory(Desktop)

const MobileStory: Story = {
  args: {
    width: 340,
  },
}
export const Mobile = getMobileStory(MobileStory)

export const Gradient: Story = {
  args: {
    primaryColor: '#FB4AB9',
    lineColorClassName: cn('bg-gradient-spark-primary-2'),
  },
}
